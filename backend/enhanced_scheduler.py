import asyncio
import logging
import random
import os
import json
import uuid
from datetime import datetime, timedelta, date
from typing import Dict, Optional
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from enhanced_hit_emulator import ga_emu_engine
from sitemap_crawler import crawl_sitemap

logger = logging.getLogger(__name__)

USE_PUBSUB = os.getenv("USE_PUBSUB", "false").lower() == "true"
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "traffic-creator")
PUBSUB_TOPIC = os.getenv("PUBSUB_TOPIC", "traffic-generation-tasks")

_pubsub_publisher = None


def get_pubsub_publisher():
    global _pubsub_publisher
    if _pubsub_publisher is None and USE_PUBSUB:
        try:
            from google.cloud import pubsub_v1

            _pubsub_publisher = pubsub_v1.PublisherClient()
        except ImportError:
            logger.warning(
                "google-cloud-pubsub not installed, falling back to direct execution"
            )
            return None
    return _pubsub_publisher


def publish_traffic_task(project_id: str, visitor_count: int) -> bool:
    publisher = get_pubsub_publisher()
    if not publisher:
        return False

    try:
        topic_path = publisher.topic_path(GCP_PROJECT_ID, PUBSUB_TOPIC)
        task_data = {
            "task_id": str(uuid.uuid4()),
            "project_id": project_id,
            "visitor_count": visitor_count,
            "created_at": datetime.utcnow().isoformat(),
        }
        future = publisher.publish(topic_path, json.dumps(task_data).encode("utf-8"))
        future.result(timeout=5)
        logger.info(
            f"Published task to Pub/Sub: project={project_id}, visitors={visitor_count}"
        )
        return True
    except Exception as e:
        logger.error(f"Failed to publish to Pub/Sub: {e}")
        return False


# Track last reset date to prevent multiple resets
_last_reset_date: Optional[date] = None


class PrecisePacer:
    """
    Precise traffic pacing system that distributes visitors evenly
    across active hours with circadian pattern support.
    """

    def __init__(
        self,
        daily_limit: int,
        active_hours_start: int = 0,
        active_hours_end: int = 24,
        day_weights: Dict[int, float] = None,
    ):
        self.daily_limit = daily_limit
        self.active_hours_start = active_hours_start  # 0-24
        self.active_hours_end = active_hours_end  # 0-24
        self.active_seconds = (active_hours_end - active_hours_start) * 3600
        # Day weights: 0=Monday, 6=Sunday. Default to 1.0 (no reduction)
        self.day_weights = day_weights or {i: 1.0 for i in range(7)}

        # Calculate base interval
        if daily_limit > 0 and self.active_seconds > 0:
            self.base_interval = self.active_seconds / daily_limit
        else:
            self.base_interval = 60  # Default: one per minute

        # Circadian pattern weights (higher = more traffic)
        # Peaks at 10 AM and 3 PM, lowest at night
        self.hour_weights = {
            0: 0.1,
            1: 0.05,
            2: 0.03,
            3: 0.02,
            4: 0.02,
            5: 0.05,
            6: 0.15,
            7: 0.3,
            8: 0.6,
            9: 0.85,
            10: 1.0,
            11: 0.95,
            12: 0.8,
            13: 0.75,
            14: 0.85,
            15: 1.0,
            16: 0.9,
            17: 0.7,
            18: 0.5,
            19: 0.4,
            20: 0.35,
            21: 0.3,
            22: 0.2,
            23: 0.15,
        }

    def is_active_hour(self, hour: int) -> bool:
        """Check if given hour is within active hours"""
        if self.active_hours_start <= self.active_hours_end:
            return self.active_hours_start <= hour < self.active_hours_end
        else:  # Wraps around midnight (e.g., 22:00 - 06:00)
            return hour >= self.active_hours_start or hour < self.active_hours_end

    def get_next_hit_delay(self, current_hour: int, current_day: int = 0) -> float:
        """
        Calculate delay until next hit based on circadian pattern and day weight.
        Returns delay in seconds.
        """
        if not self.is_active_hour(current_hour):
            # Calculate time until active hours start
            now = datetime.utcnow()
            if current_hour < self.active_hours_start:
                hours_until = self.active_hours_start - current_hour
            else:
                hours_until = (24 - current_hour) + self.active_hours_start
            return hours_until * 3600

        # Apply circadian weight to interval
        hour_weight = self.hour_weights.get(current_hour, 0.5)
        day_weight = self.day_weights.get(current_day, 1.0)

        total_weight = hour_weight * day_weight
        adjusted_interval = (
            self.base_interval / total_weight
            if total_weight > 0
            else self.base_interval
        )

        # Add small random jitter (±10%) to avoid pattern detection
        jitter = random.uniform(0.9, 1.1)
        return adjusted_interval * jitter

    def get_visitors_for_minute(self, current_hour: int, current_day: int = 0) -> int:
        """
        Calculate how many visitors to spawn in the next minute
        based on circadian pattern and day weight.
        """
        if not self.is_active_hour(current_hour):
            return 0

        hour_weight = self.hour_weights.get(current_hour, 0.5)
        day_weight = self.day_weights.get(current_day, 1.0)

        visitors_per_hour = (
            (self.daily_limit / self.active_seconds) * 3600 * hour_weight * day_weight
        )
        visitors_per_minute = visitors_per_hour / 60

        # Add variance and ensure at least 1 if we have any traffic
        variance = random.uniform(0.8, 1.2)
        result = int(visitors_per_minute * variance)

        # Ensure at least 1 visitor per minute during active hours if daily_limit > 0
        if result == 0 and self.daily_limit > 0 and visitors_per_minute > 0:
            result = 1

        return result


class TrafficScheduler:
    def __init__(self):
        self.is_running = False
        self._task = None
        self.pacers: Dict[str, PrecisePacer] = {}  # project_id -> Pacer
        self.last_hit_time: Dict[str, datetime] = {}  # project_id -> last hit time
        self.last_crawl_time: Dict[
            str, datetime
        ] = {}  # project_id -> last sitemap crawl time
        self.is_globally_paused = False
        self._concurrency_semaphore = asyncio.Semaphore(
            2
        )  # Limit concurrent DB operations

    async def start(self):
        if self.is_running:
            return
        self.is_running = True

        # Log startup status
        # Removed blocking DB check to prevent startup hang
        logger.info("Scheduler starting background loop...")

        self._task = asyncio.create_task(self._loop())
        logger.info("Enhanced Traffic Scheduler started with Precise Pacing")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Enhanced Traffic Scheduler stopped")

    async def _loop(self):
        """Main scheduler loop - runs every second for precise timing"""
        while self.is_running:
            try:
                await self.check_and_run()
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")

            # Sleep for 1 second for precise timing
            await asyncio.sleep(1)

    def _get_or_create_pacer(self, project: models.Project) -> PrecisePacer:
        """Get existing pacer or create new one for project"""
        if project.id not in self.pacers:
            settings = project.settings or {}
            active_start = settings.get("active_hours_start", 0)
            active_end = settings.get("active_hours_end", 24)
            day_weights = settings.get("day_weights")  # Optional dict {0: 0.5, 6: 0.2}

            self.pacers[project.id] = PrecisePacer(
                daily_limit=project.daily_limit,
                active_hours_start=active_start,
                active_hours_end=active_end,
                day_weights=day_weights,
            )
        else:
            # Update pacer if settings changed
            self.pacers[project.id].daily_limit = project.daily_limit

        return self.pacers[project.id]

    async def check_and_run(self):
        """Check all active projects and trigger hits based on precise pacing"""
        if self.is_globally_paused:
            logger.debug("Scheduler globally paused")
            return

        db = SessionLocal()
        try:
            now = datetime.utcnow()
            current_hour = now.hour
            current_day = now.weekday()  # 0=Monday, 6=Sunday

            # 1. Daily Reset at Midnight (UTC) - track by date to prevent multiple resets
            global _last_reset_date
            today = now.date()
            if now.hour == 0 and now.minute == 0 and _last_reset_date != today:
                _last_reset_date = today
                db.query(models.Project).update({models.Project.hits_today: 0})
                db.commit()
                logger.info("Daily project hits reset to zero")

            # 2. Find All Active Projects
            active_projects = (
                db.query(models.Project).filter(models.Project.status == "active").all()
            )

            # Log every 60 seconds
            if now.second == 0:
                logger.info(
                    f"Scheduler tick: Found {len(active_projects)} active projects, hour={current_hour}"
                )

            for project in active_projects:
                try:
                    await self._process_project(
                        db, project, now, current_hour, current_day
                    )
                except Exception as e:
                    logger.error(f"Error processing project {project.id}: {e}")

        except Exception as e:
            logger.error(f"Scheduler check failed: {e}")
        finally:
            db.close()

    async def _check_sitemap_crawling(
        self, db: Session, project: models.Project, now: datetime
    ):
        """Check and run sitemap crawling if enabled and due"""
        settings = project.settings or {}
        if not settings.get("sitemapAutoCrawl"):
            return

        sitemap_url = settings.get("sitemap")
        if not sitemap_url:
            return

        # Check interval (1 hour)
        last_crawl = self.last_crawl_time.get(project.id)
        if last_crawl and (now - last_crawl).total_seconds() < 3600:
            return

        logger.info(f"Crawling sitemap for project {project.id}: {sitemap_url}")

        # Crawl
        try:
            urls = await crawl_sitemap(sitemap_url)
            if urls:
                # Update project settings with new URLs
                # We'll store them in 'crawledUrls' to avoid overwriting user customSubpages
                # But we need to update the JSON field in DB

                # IMPORTANT: Since project.settings is a JSON field, updating it requires careful handling
                # Create a copy to ensure SQLAlchemy detects change
                new_settings = dict(settings)
                new_settings["crawledUrls"] = urls[
                    :500
                ]  # Limit to 500 urls to prevent bloat

                project.settings = new_settings

                # Mark modified for SQLAlchemy
                from sqlalchemy.orm.attributes import flag_modified

                flag_modified(project, "settings")

                db.commit()
                logger.info(
                    f"Updated project {project.id} with {len(urls)} crawled URLs"
                )

            self.last_crawl_time[project.id] = now

        except Exception as e:
            logger.error(f"Failed to crawl sitemap for {project.id}: {e}")

    async def _process_project(
        self,
        db: Session,
        project: models.Project,
        now: datetime,
        current_hour: int,
        current_day: int,
    ):
        """Process a single project - check quotas and trigger hits"""

        # Log project processing every 60 seconds
        if now.second == 0:
            settings = project.settings or {}
            geo_targets = settings.get("geoTargets", [])
            logger.info(
                f"Processing project {project.id}: status={project.status}, daily_limit={project.daily_limit}, hits_today={project.hits_today}, total_target={project.total_target}, total_hits={project.total_hits}, geoTargets={geo_targets}"
            )

        # 0. Check Sitemap Crawling
        await self._check_sitemap_crawling(db, project, now)

        # Quota Check - Daily Limit
        if project.daily_limit > 0 and project.hits_today >= project.daily_limit:
            if now.second == 0:
                logger.info(
                    f"Project {project.id}: Daily limit reached ({project.hits_today}/{project.daily_limit})"
                )
            return

        # Quota Check - Total Target
        if project.total_target > 0 and project.total_hits >= project.total_target:
            logger.info(
                f"Project {project.id} ({project.name}) reached total target. Completing..."
            )
            project.status = "completed"
            db.commit()
            return

        # Check Expiry
        if project.expires_at and now > project.expires_at:
            project.status = "completed"
            db.commit()
            return

        # Get or create pacer for this project
        pacer = self._get_or_create_pacer(project)

        # Check if it's an active hour
        if not pacer.is_active_hour(current_hour):
            if now.second == 0:
                logger.info(
                    f"Project {project.id}: Outside active hours (hour={current_hour})"
                )
            return

        # Check if enough time has passed since last hit
        last_hit = self.last_hit_time.get(project.id)
        if last_hit:
            delay = pacer.get_next_hit_delay(current_hour, current_day)
            time_since_last = (now - last_hit).total_seconds()
            if time_since_last < delay:
                return

        # Calculate how many visitors to spawn now
        visitors_to_spawn = pacer.get_visitors_for_minute(current_hour, current_day)

        # Max burst default to 10 (Standard Pacing)
        max_burst = 10

        # Limit burst size and respect remaining quota
        remaining_daily = (
            max(0, project.daily_limit - project.hits_today)
            if project.daily_limit > 0
            else visitors_to_spawn
        )
        remaining_total = (
            max(0, project.total_target - project.total_hits)
            if project.total_target > 0
            else visitors_to_spawn
        )

        visitors_to_spawn = min(
            visitors_to_spawn, remaining_daily, remaining_total, max_burst
        )

        # Debug logging
        if now.second == 0:
            logger.info(
                f"Project {project.id}: visitors_to_spawn={visitors_to_spawn}, remaining_daily={remaining_daily}, remaining_total={remaining_total}, pacer_daily={pacer.daily_limit}"
            )

        if visitors_to_spawn <= 0:
            return

        # Update last hit time
        self.last_hit_time[project.id] = now

        # Trigger the hits
        logger.info(
            f"Scheduler: Spawning {visitors_to_spawn} visitors for Project {project.name} (Hour: {current_hour})"
        )

        if USE_PUBSUB:
            published = publish_traffic_task(project.id, visitors_to_spawn)
            if not published:
                logger.warning(f"Pub/Sub failed, falling back to direct execution")

                async def _run_with_semaphore():
                    async with self._concurrency_semaphore:
                        await ga_emu_engine.run_for_project(
                            project.id, visitors_to_spawn
                        )

                asyncio.create_task(_run_with_semaphore())
        else:

            async def _run_with_semaphore():
                async with self._concurrency_semaphore:
                    await ga_emu_engine.run_for_project(project.id, visitors_to_spawn)

            asyncio.create_task(_run_with_semaphore())


# Global scheduler instance
scheduler = TrafficScheduler()
