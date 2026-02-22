import sys, os, asyncio, datetime
from pprint import pprint
import traceback

sys.path.insert(0, '/Users/martin/ab/backend')
from database import SessionLocal
import models
from enhanced_hit_emulator import ga_emu_engine
from enhanced_scheduler import TrafficScheduler

async def test():
    db = SessionLocal()
    project = db.query(models.Project).filter(models.Project.status == 'active').first()
    if not project:
        print("No active project")
        return
    
    print(f"Testing project: {project.id}, Name: {project.name}")
    try:
        await ga_emu_engine.run_for_project(project.id, 1)
        print("Finished run_for_project successfully")
    except Exception as e:
        print("EXCEPTION RAISED:")
        traceback.print_exc()

asyncio.run(test())
