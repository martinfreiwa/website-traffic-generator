import sys, os
from pprint import pprint

print("Starting debug script")

try:
    sys.path.insert(0, '/Users/martin/ab/backend')
    print("Importing database...")
    from database import SessionLocal
    print("Importing models...")
    import models
    print("Importing ga_emu_engine...")
    from enhanced_hit_emulator import ga_emu_engine
    import asyncio
    print("All imports done")
except Exception as e:
    print("Exception during import:", e)
    sys.exit(1)

async def test():
    try:
        print("Creating SessionLocal")
        db = SessionLocal()
        print("Querying project")
        project = db.query(models.Project).filter(models.Project.status == 'active').first()
        if not project:
            print("No active project")
            return
        
        print(f"Testing project: {project.id}, Name: {project.name}")
        await ga_emu_engine.run_for_project(project.id, 1)
        print("Finished run_for_project successfully")
    except Exception as e:
        print(f"Exception during test: {e}")

asyncio.run(test())
