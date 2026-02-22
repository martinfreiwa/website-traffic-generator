import sys, os, asyncio, datetime
from pprint import pprint

sys.path.insert(0, '/Users/martin/ab/backend')
from database import SessionLocal
import models
from enhanced_scheduler import TrafficScheduler

async def test():
    db = SessionLocal()
    project = db.query(models.Project).filter(models.Project.status == 'active').first()
    if not project:
        print("No active project")
        return
    sched = TrafficScheduler()
    sched.is_running = True
    now = datetime.datetime.utcnow()
    current_hour = now.hour
    current_day = now.weekday()
    
    print("Project hits_today:", project.hits_today)
    pacer = sched._get_or_create_pacer(project)
    print("Visitors to spawn for minute:", pacer.get_visitors_for_minute(current_hour, current_day))
    
    await sched._process_project(db, project, now, current_hour, current_day)
    print("Finished _process_project")

asyncio.run(test())
