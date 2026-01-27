import asyncio
import logging
import random
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from hit_emulator import ga_emu_engine
from visitor_engine import visitor_engine

logger = logging.getLogger(__name__)

def get_circadian_multiplier(hour):
    # Sinusoidal curve or discrete steps
    # 3 AM -> 0.2, 2 PM -> 1.2
    if 0 <= hour <= 5: return random.uniform(0.2, 0.4)
    if 6 <= hour <= 9: return random.uniform(0.5, 0.8)
    if 10 <= hour <= 17: return random.uniform(1.0, 1.2)
    if 18 <= hour <= 21: return random.uniform(0.7, 0.9)
    return random.uniform(0.4, 0.6) # 22-23

class TrafficScheduler:
    def __init__(self):
        self.is_running = False
        self._task = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Traffic Scheduler started")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Traffic Scheduler stopped")

    async def _loop(self):
        while self.is_running:
            try:
                await self.check_and_run()
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
            await asyncio.sleep(60) # Check every minute

    async def check_and_run(self):
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            current_hour = now.hour
            
            # Find active projects
            active_projects = db.query(models.Project).filter(models.Project.is_active == True).all()
            
            # 0. Daily Reset Hits
            if now.hour == 0 and now.minute == 0:
                db.query(models.Project).update({models.Project.hits_today: 0})
                db.commit()
                logger.info("Daily hits counter reset")

            # Fetch active proxies
            db_proxies = db.query(models.Proxy).filter(models.Proxy.is_active == True).all()
            proxy_pool = [{"url": p.url, "country": p.country} for p in db_proxies]

            for project in active_projects:
                # 1. Check Date Range
                if project.start_date and now < project.start_date:
                    continue
                if project.end_date and now > project.end_date:
                    continue
                
                # 2. Check Operating Hours
                if project.active_hours_start is not None and project.active_hours_end is not None:
                    if project.active_hours_start <= project.active_hours_end:
                        # Normal range (e.g. 9-17)
                        if not (project.active_hours_start <= current_hour <= project.active_hours_end):
                            continue
                    else:
                        # Overnight range (e.g. 22-04)
                        if not (current_hour >= project.active_hours_start or current_hour <= project.active_hours_end):
                            continue
                
                # 2.5 Check Volume Capping
                if project.daily_visitor_limit and project.hits_today >= project.daily_visitor_limit:
                    logger.info(f"Daily limit reached for project: {project.name} ({project.hits_today})")
                    continue
                
                # 3. If within schedule, ensure traffic is running
                # Note: Currently our engines are simple "one-off" runs. 
                # We need to adapt them to be "always on" or manageable.
                # For now, if not running, we start a 2-minute burst and check again in 1 min.
                
                if not (ga_emu_engine.is_running or visitor_engine.is_running):
                    logger.info(f"Starting scheduled traffic for project: {project.name}")
                    target_dicts = [
                        {
                            "url": t.url, 
                            "title": t.title,
                            "tid": t.tid, 
                            "funnel": [{"url": s.url, "title": s.title} for s in t.funnel_steps]
                        } for t in project.targets
                    ]
                    
                    vpm = project.visitors_per_min
                    
                    # 4. Apply Dynamic Volume Adjustments
                    # Weekend reduction (50%)
                    if now.weekday() >= 5: # 5=Sat, 6=Sun
                        vpm = int(vpm * 0.5)
                        logger.info(f"Weekend reduction active: {vpm} vpm")

                    if project.enable_circadian_rhythm:
                        multiplier = get_circadian_multiplier(current_hour)
                        vpm = int(vpm * multiplier)
                        logger.info(f"Circadian rhythm active: multiplier {multiplier:.2f} -> {vpm} vpm")

                    await ga_emu_engine.run_simulation(
                        target_dicts,
                        vpm,
                        duration_mins=2, # Run for 2 mins, we check every 1 min
                        returning_visitor_pct=project.returning_visitor_pct,
                        bounce_rate_pct=project.bounce_rate_pct,
                        referrer=project.referrer,
                        proxies=proxy_pool,
                        utm_tags=project.utm_tags,
                        device_dist=project.device_distribution,
                        source_preset=project.traffic_source_preset,
                        target_country=project.target_country,
                        is_dry_run=project.is_dry_run,
                        tier=project.tier,
                        project_id=project.id
                    )
                    
                    project.last_run = now
                    db.commit()
        finally:
            db.close()

scheduler = TrafficScheduler()
