import sys, os, traceback
sys.path.insert(0, '/Users/martin/ab/backend')
from database import SessionLocal
import models
from enhanced_hit_emulator import ga_emu_engine
import asyncio

async def test():
    db = SessionLocal()
    project = db.query(models.Project).filter(models.Project.status == 'active').first()
    if not project:
        print("No active project")
        return
    
    print(f"Testing project {project.id}")
    for i in range(5):
        try:
            print(f"Iteration {i+1}...")
            await ga_emu_engine.run_for_project(project.id, 1)
        except Exception as e:
            traceback.print_exc()

asyncio.run(test())
