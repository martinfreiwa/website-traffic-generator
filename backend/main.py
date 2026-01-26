from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from visitor_engine import visitor_engine
from hit_emulator import ga_emu_engine
from web_utils import prefetch_titles, TITLE_CACHE

app = FastAPI(title="Website Visitor Generator API")

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
    mode: str = "direct_hit" # "visit" or "direct_hit"
    returning_visitor_pct: int = 0
    bounce_rate_pct: int = 0
    referrer: str = ""

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/stats")
async def get_stats():
    return {
        "is_running": visitor_engine.is_running or ga_emu_engine.is_running,
        "visit_stats": visitor_engine.stats,
        "hit_stats": ga_emu_engine.stats,
        "cached_titles_count": len(TITLE_CACHE)
    }

@app.get("/titles")
async def get_titles():
    return TITLE_CACHE

@app.post("/start")
async def start_traffic(request: TrafficRequest, background_tasks: BackgroundTasks):
    if visitor_engine.is_running or ga_emu_engine.is_running:
        raise HTTPException(status_code=400, detail="Simulation already running")
    
    # Pre-fetch titles for all targets and funnel steps
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
        # High-scale direct hit emulation
        target_dicts = [
            {
                "url": t.url, 
                "title": t.title,
                "tid": t.tid, 
                "funnel": [{"url": s.url, "title": s.title} for s in t.funnel]
            } for t in request.targets
        ]
        background_tasks.add_task(
            ga_emu_engine.run_simulation,
            target_dicts,
            request.visitors_per_min,
            request.duration_mins,
            request.returning_visitor_pct,
            request.bounce_rate_pct,
            request.referrer
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
