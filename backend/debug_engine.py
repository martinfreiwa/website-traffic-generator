
import asyncio
import logging
import database
import models
from hit_emulator import ga_emu_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debugger")

async def debug_run():
    db = database.SessionLocal()
    # Get the project created by verify_v2
    # It was named "Verify V2 Project"
    project = db.query(models.Project).filter(models.Project.name == "Verify V2 Project").order_by(models.Project.created_at.desc()).first()
    
    if not project:
        logger.error("Project not found!")
        return

    logger.info(f"Found Project: {project.id}, Daily Limit: {project.daily_limit}, Status: {project.status}")
    logger.info(f"Settings: {project.settings}")
    
    # Run Engine Manually
    logger.info("Triggering run_for_project...")
    await ga_emu_engine.run_for_project(project.id)
    
    # Check Logs
    logs = db.query(models.TrafficLog).filter(models.TrafficLog.project_id == project.id).all()
    logger.info(f"Traffic Logs count: {len(logs)}")
    for log in logs:
        logger.info(f"Log: {log.url} - {log.status} - {log.event_type}")

    db.close()

if __name__ == "__main__":
    asyncio.run(debug_run())
