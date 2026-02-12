import asyncio
import logging
import random
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from hit_emulator import ga_emu_engine

logger = logging.getLogger(__name__)

class TrafficScheduler:
    def __init__(self):
        self.is_running = False
        self._task = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("SaaS Traffic Scheduler started")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("SaaS Traffic Scheduler stopped")

    async def _loop(self):
        while self.is_running:
            try:
                await self.check_and_run()
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
            await asyncio.sleep(60) # Pulse every minute

    async def check_and_run(self):
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            
            # 1. Daily Reset at Midnight (UTC)
            if now.hour == 0 and now.minute == 0:
                # We check if we already reset within this minute to avoid multiple updates
                db.query(models.Project).update({models.Project.hits_today: 0})
                db.commit()
                logger.info("Daily project hits reset to zero")

            # 2. Find All Active Projects
            active_projects = db.query(models.Project).filter(models.Project.status == "active").all()
            
            for project in active_projects:
                # Quota Check
                if project.daily_limit > 0 and project.hits_today >= project.daily_limit:
                    logger.debug(f"Project {project.id} ({project.name}) reached daily limit: {project.hits_today}/{project.daily_limit}")
                    continue

                if project.total_target > 0 and project.total_hits >= project.total_target:
                    logger.info(f"Project {project.id} ({project.name}) reached total target: {project.total_hits}/{project.total_target}. Completing...")
                    project.status = "completed"
                    db.commit()
                    continue

                # Check Expiry
                if project.expires_at and now > project.expires_at:
                    project.status = "completed"
                    db.commit()
                    continue

                # Run Burst
                asyncio.create_task(ga_emu_engine.run_for_project(project.id))

        except Exception as e:
            logger.error(f"Scheduler check failed: {e}")
        finally:
            db.close()

scheduler = TrafficScheduler()
