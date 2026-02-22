import sys, os, random, time, datetime
import asyncio
from pprint import pprint

sys.path.insert(0, '/Users/martin/ab/backend')
from database import SessionLocal
import models
from enhanced_hit_emulator import ga_emu_engine
from sqlalchemy.orm.attributes import flag_modified
from web_utils import TITLE_CACHE

async def run_test():
    db = SessionLocal()
    project = db.query(models.Project).filter(models.Project.status == 'active').first()
    if not project:
        print("No active project")
        return
        
    print(f"Running test for project: {project.id}")
    url = "https://ladiscussione.com/"
    TITLE_CACHE[url] = "La Discussione - Homepage"
    
    settings = project.settings or {}
    settings['entryUrls'] = url
    settings['targetUrl'] = url
    settings['ga4Tid'] = 'G-C5LL2KW5H4'
    settings['geoTargets'] = [{'id': 'geo-1', 'country': 'United States', 'countryCode': 'US', 'percent': 100}]
    project.settings = settings
    flag_modified(project, "settings")
    db.commit()
    
    dt_start = datetime.datetime.utcnow()
    
    # Speed up the sequential loop inside run_for_project
    original_sleep = asyncio.sleep
    async def fast_sleep(sec):
        return
    asyncio.sleep = fast_sleep
    
    print(f"Kicking off 1000 hits to {url}...")
    
    # Make sure we track successes and errors locally for summary
    
    # ga_emu_engine.run_for_project doesn't return anything, it writes to DB.
    await ga_emu_engine.run_for_project(project.id, 1000)
    
    total = db.query(models.TrafficLog).filter(models.TrafficLog.timestamp > dt_start).count()
    success = db.query(models.TrafficLog).filter(models.TrafficLog.timestamp > dt_start, models.TrafficLog.status == 'success').count()
    errors = total - success
    
    print("="*40)
    print("TRAFFIC TEST COMPLETED")
    print(f"Total Attempted Logs in DB: {total}")
    print(f"Successes: {success}")
    print(f"Errors: {errors}")
    if total > 0:
        print(f"Success Rate: {(success/total)*100:.2f}%")
        
    errors_grouped = db.query(models.TrafficLog.status).filter(models.TrafficLog.timestamp > dt_start, models.TrafficLog.status == 'error').all()
    # It just logs "error" or "success", it doesn't log the reason easily in TrafficLog.
    # We will also read from enhanced_hit_emulator stats
    print("Engine Stats:", ga_emu_engine.stats.get(project.id, {}))
    
    asyncio.sleep = original_sleep

asyncio.run(run_test())
