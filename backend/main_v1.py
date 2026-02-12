from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from visitor_engine import visitor_engine
from hit_emulator import ga_emu_engine
from web_utils import prefetch_titles, TITLE_CACHE, find_ga4_tid
from sqlalchemy.orm import Session
import database, models
from database import get_db
from fastapi import Depends
import re
import httpx

from scheduler import scheduler

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Website Visitor Generator API")

@app.on_event("startup")
async def startup_event():
    await scheduler.start()

def seed_default_proxies():
    db = database.SessionLocal()
    # Geonode Residential FR with session port range 9000-9010
    base_user = "geonode_d0HRbZWDCV-type-residential-country-fr"
    password = "92a8dcc4-52fe-445d-989c-5158a5f5ca09"
    host = "92.204.164.15"
    
    for port in range(9000, 9011):
        proxy_url = f"http://{base_user}:{password}@{host}:{port}"
        exists = db.query(models.Proxy).filter(models.Proxy.url == proxy_url).first()
        if not exists:
            db.add(models.Proxy(url=proxy_url, country="FR", is_active=True))
    db.commit()
    db.close()

@app.on_event("shutdown")
async def shutdown_event():
    await scheduler.stop()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FunnelStep(BaseModel):
    url: str
    title: str = ""

class Target(BaseModel):
    url: str
    title: str = "" # Custom Page Title
    tid: str = None  # GA4 Tracking ID (Target ID)
    funnel: list[FunnelStep] = [] # List of structured funnel steps

class TrafficRequest(BaseModel):
    targets: list[Target]
    visitors_per_min: int = 100
    duration_mins: int = 1
    total_visitor_count: int = None # Optional override for exact volume
    mode: str = "direct_hit" # "visit" or "direct_hit"
    returning_visitor_pct: int = 0
    bounce_rate_pct: int = 0
    referrer: str = ""
    target_country: str = None
    target_state: str = None
    target_city: str = None
    traffic_source_preset: str = "direct"
    utm_tags: dict = None
    device_distribution: dict = None
    is_dry_run: bool = False
    tier: str = "professional"

# --- Project Management Endpoints ---

@app.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()

@app.post("/projects")
def create_project(project_data: dict, db: Session = Depends(get_db)):
    # Basic project creation logic
    db_project = models.Project(
        name=project_data.get("name", "New Project"),
        description=project_data.get("description"),
        visitors_per_min=project_data.get("visitors_per_min", 100),
        mode=project_data.get("mode", "direct_hit"),
        returning_visitor_pct=project_data.get("returning_visitor_pct", 0),
        bounce_rate_pct=project_data.get("bounce_rate_pct", 0),
        referrer=project_data.get("referrer", ""),
        start_date=project_data.get("start_date"),
        end_date=project_data.get("end_date"),
        active_hours_start=project_data.get("active_hours_start"),
        active_hours_end=project_data.get("active_hours_end"),
        target_country=project_data.get("target_country"),
        target_state=project_data.get("target_state"),
        target_city=project_data.get("target_city"),
        traffic_source_preset=project_data.get("traffic_source_preset", "direct"),
        utm_tags=project_data.get("utm_tags"),
        device_distribution=project_data.get("device_distribution"),
        is_dry_run=project_data.get("is_dry_run", False),
        tier=project_data.get("tier", "professional"),
        daily_visitor_limit=project_data.get("daily_visitor_limit", 2000) # Auto-provision 2,000 visitors
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Add targets
    for t_data in project_data.get("targets", []):
        db_target = models.Target(
            project_id=db_project.id,
            url=t_data.get("url"),
            title=t_data.get("title"),
            tid=t_data.get("tid")
        )
        db.add(db_target)
        db.commit()
        db.refresh(db_target)
        
        for s_data in t_data.get("funnel", []):
            db_step = models.FunnelStep(
                target_id=db_target.id,
                url=s_data.get("url"),
                title=s_data.get("title")
            )
            db.add(db_step)
    
    db.commit()
    db.refresh(db_project)
    return {
        "id": db_project.id,
        "name": db_project.name,
        "message": "Project created successfully"
    }

@app.get("/projects/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}

# --- Proxy Management Endpoints ---

@app.get("/proxies")
def list_proxies(db: Session = Depends(get_db)):
    return db.query(models.Proxy).all()

@app.post("/proxies")
def create_proxy(proxy_data: dict, db: Session = Depends(get_db)):
    db_proxy = models.Proxy(
        url=proxy_data.get("url"),
        country=proxy_data.get("country"),
        city=proxy_data.get("city"),
        is_active=proxy_data.get("is_active", True)
    )
    db.add(db_proxy)
    db.commit()
    db.refresh(db_proxy)
    return db_proxy

@app.post("/proxies/bulk")
def bulk_create_proxies(request: dict, db: Session = Depends(get_db)):
    proxy_urls = request.get("proxies", [])
    added = 0
    for raw_line in proxy_urls:
        line = raw_line.strip()
        if not line: continue
        
        proxy_url = line
        country = None
        city = None
        
        # Format 1: host:port@user:pass (user provided format)
        if "@" in line and line.count(":") >= 2 and not line.startswith("http"):
            try:
                # 92.204.164.15:9000@user:pass
                parts = line.split("@")
                host_port = parts[0]
                user_pass = parts[1]
                proxy_url = f"http://{user_pass}@{host_port}"
            except:
                pass

        # Try to extract country/city from the proxy string (Geonode specific)
        # Pattern: -country-XX-state-...-city-YYYY
        country_match = re.search(r'-country-([a-z]{2})', proxy_url, re.I)
        if country_match:
            country = country_match.group(1).upper()

        state_match = re.search(r'-state-([a-z0-9\-]+)', proxy_url, re.I)
        if state_match:
            state = state_match.group(1).replace("-", " ").title()
            
        city_match = re.search(r'-city-([a-z0-9\-]+)', proxy_url, re.I)
        if city_match:
            city = city_match.group(1).replace("-", " ").title()

        # Basic deduplication
        exists = db.query(models.Proxy).filter(models.Proxy.url == proxy_url).first()
        if not exists:
            db_proxy = models.Proxy(
                url=proxy_url, 
                country=country, 
                state=state,
                city=city,
                is_active=True
            )
            db.add(db_proxy)
            added += 1
            
    db.commit()
    return {"message": f"Added {added} proxies"}

@app.post("/proxies/test")
async def test_proxy_url(request: dict):
    proxy_url = request.get("url")
    if not proxy_url:
        raise HTTPException(status_code=400, detail="Proxy URL required")
    
    try:
        # Correct httpx way: proxy goes in Client constructor
        async with httpx.AsyncClient(timeout=10.0, proxy=proxy_url) as client:
            # Test by reaching google analytics
            response = await client.get("https://www.google-analytics.com/generate_204")
            if response.status_code in [200, 204]:
                return {"status": "success", "reachable": True}
            return {"status": "error", "reachable": False, "detail": f"Status code: {response.status_code}"}
    except Exception as e:
        return {"status": "error", "reachable": False, "detail": str(e)}

@app.post("/proxies/{proxy_id}/test")
async def test_existing_proxy(proxy_id: int, db: Session = Depends(get_db)):
    proxy = db.query(models.Proxy).filter(models.Proxy.id == proxy_id).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    
    try:
        async with httpx.AsyncClient(timeout=10.0, proxy=proxy.url) as client:
            response = await client.get("https://www.google-analytics.com/generate_204")
            reachable = response.status_code in [200, 204]
            return {"reachable": reachable, "status_code": response.status_code}
    except Exception as e:
        return {"reachable": False, "error": str(e)}

@app.post("/proxies/geonode")
def add_geonode_proxies(request: dict, db: Session = Depends(get_db)):
    username = request.get("username")
    password = request.get("password")
    countries = request.get("countries", []) # List of ISO codes
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and Password required")
    
    # Base host excluding port
    base_host_only = "premium-residential.geonode.com"
    
    added = 0
    # Add country-specific proxies with port range 9000-9010
    for country in countries:
        if not country: continue
        
        # We generate 10 sticky sessions (ports 9000-9009) for each country
        for port in range(9000, 9010):
            # Username format: geonode_USER-country-CC
            # Note: Geonode user needs "-type-residential" usually? 
            # The user's credential example was: geonode_d0HRbZWDCV-type-residential-country-fr
            # We should probably construct it carefully. 
            # Assuming the user passes just "geonode_d0HRbZWDCV" as username, we append the rest.
            
            # If user passed full string including "-type-residential", strictly appending might duplicate.
            # Let's try to be smart. If "type-residential" is not in username, we add it.
            
            base_user = username
            if "type-residential" not in base_user:
                 base_user += "-type-residential"
            
            final_user = f"{base_user}-country-{country.lower()}"
            
            country_url = f"http://{final_user}:{password}@{base_host_only}:{port}"
            
            exists = db.query(models.Proxy).filter(models.Proxy.url == country_url).first()
            if not exists:
                db.add(models.Proxy(url=country_url, country=country.upper(), is_active=True))
                added += 1
            
    db.commit()
    return {"message": f"Generated {added} Geonode proxies (Ports 9000-9009 per country)"}

@app.get("/geonode/targeting-options")
async def get_geonode_targeting_options(username: str = None, password: str = None):
    url = "https://monitor.geonode.com/services/RESIDENTIAL-PREMIUM/targeting-options"
    auth = None
    if username and password:
        auth = httpx.BasicAuth(username, password)
    
    try:
        async with httpx.AsyncClient(timeout=20.0, auth=auth) as client:
            response = await client.get(url)
            # If 401, maybe try without auth if it's a public doc? 
            # But Geonode usually requires it.
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Geonode options: {str(e)}")

@app.delete("/proxies/{proxy_id}")
def delete_proxy(proxy_id: int, db: Session = Depends(get_db)):
    proxy = db.query(models.Proxy).filter(models.Proxy.id == proxy_id).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    db.delete(proxy)
    db.commit()
    return {"message": "Proxy deleted"}

@app.get("/find-tid")
async def find_tid(url: str):
    tid = await find_ga4_tid(url)
    if not tid:
        raise HTTPException(status_code=404, detail="GA4 Tracking ID not found on this page")
    return {"url": url, "tid": tid}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/stats")
async def get_stats():
    return {
        "is_running": visitor_engine.is_running or ga_emu_engine.is_running,
        "visit_stats": visitor_engine.stats,
        "hit_stats": ga_emu_engine.stats,
        "cached_titles_count": len(TITLE_CACHE),
        "recent_events": ga_emu_engine.recent_events
    }

@app.get("/events")
async def get_events():
    return ga_emu_engine.recent_events

@app.get("/projects/{project_id}/logs")
def get_project_logs(project_id: int, limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.TrafficLog).filter(models.TrafficLog.project_id == project_id).order_by(models.TrafficLog.timestamp.desc()).limit(limit).all()
    return logs

@app.get("/titles")
async def get_titles():
    return TITLE_CACHE

@app.post("/start")
async def start_traffic(request: TrafficRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if visitor_engine.is_running or ga_emu_engine.is_running:
        raise HTTPException(status_code=400, detail="Simulation already running")
    
    # Fetch active proxies
    db_proxies = db.query(models.Proxy).filter(models.Proxy.is_active == True).all()
    proxy_pool = [{"url": p.url, "country": p.country, "city": p.city} for p in db_proxies]
    urls_to_fetch = []
    for t in request.targets:
        urls_to_fetch.append(t.url)
        for s in t.funnel:
            urls_to_fetch.append(s.url)
    
    if urls_to_fetch:
        # Create a background task to fetch titles, or wait for them if we want them immediately
        # The user said "before you send traffic", so we should ideally wait or ensure they are fetched
        await prefetch_titles(urls_to_fetch)
    
    if request.mode == "visit":
        urls = [t.url for t in request.targets]
        background_tasks.add_task(
            visitor_engine.run_simulation, 
            urls, 
            request.visitors_per_min * request.duration_mins, 
            5 # Increased concurrency for visit mode
        )
    else:
        target_dicts = []
        for t in request.targets:
            # Auto-populate title if missing
            title = t.title or TITLE_CACHE.get(t.url, "Auto Page View")
            funnel_steps = []
            for s in t.funnel:
                s_title = s.title or TITLE_CACHE.get(s.url, "Auto Funnel Step")
                funnel_steps.append({"url": s.url, "title": s_title})
            
            target_dicts.append({
                "url": t.url, 
                "title": title,
                "tid": t.tid, 
                "funnel": funnel_steps
            })

        background_tasks.add_task(
            ga_emu_engine.run_simulation,
            target_dicts,
            request.visitors_per_min,
            request.duration_mins,
            request.returning_visitor_pct,
            request.bounce_rate_pct,
            request.referrer,
            proxy_pool,
            request.utm_tags,
            request.device_distribution,
            request.traffic_source_preset,
            request.target_country,
            request.target_state,
            request.target_city,
            request.is_dry_run,
            request.tier,
            request.total_visitor_count
        )
        
    return {"message": "Traffic simulation started"}

@app.post("/test-url")
async def test_url(target: Target):
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            response = await client.get(target.url)
            return {
                "url": target.url,
                "status_code": response.status_code,
                "reachable": response.status_code == 200
            }
    except Exception as e:
        return {
            "url": target.url,
            "status_code": None,
            "reachable": False,
            "error": str(e)
        }

@app.post("/stop")
async def stop_traffic():
    visitor_engine.stop()
    ga_emu_engine.stop()
    return {"message": "Traffic simulation stopping"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
