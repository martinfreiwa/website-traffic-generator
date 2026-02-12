import asyncio
import aiohttp
import random
import time
import urllib.parse
import logging
import datetime
from web_utils import TITLE_CACHE
import database
import models
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DESKTOP_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

MOBILE_UAS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
]

TABLET_UAS = [
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
]

SCREEN_RESOLUTIONS_DESKTOP = ["1920x1080", "1536x864", "1366x768", "1440x900", "1280x720"]
SCREEN_RESOLUTIONS_MOBILE = ["390x844", "414x896", "360x800", "375x667"]

SOCIAL_REFERRERS = {
    "Facebook": "https://l.facebook.com/l.php",
    "Twitter": "https://t.co/",
    "Instagram": "https://www.instagram.com/",
    "LinkedIn": "https://www.linkedin.com/",
    "Reddit": "https://www.reddit.com/"
}

ORGANIC_REFERRERS = {
    "Google": "https://www.google.com/search?q=",
    "Bing": "https://www.bing.com/search?q=",
    "Yahoo": "https://search.yahoo.com/search?p="
}

ALL_UAS = DESKTOP_UAS + MOBILE_UAS + TABLET_UAS

LANGUAGES = ["en-US,en;q=0.9", "en-GB,en;q=0.8", "de-DE,de;q=0.9", "fr-FR,fr;q=0.9", "it-IT,it;q=0.9", "es-ES,es;q=0.9"]

class GAEmuEngine:
    def __init__(self):
        self.is_running = False
        self.stats = {} # Per-project stats: {project_id: {"success": 0, "failure": 0, "total": 0}}
        self.cid_pool = {} # Per-project CID pool: {project_id: [cids]}
        self.max_cid_pool_size = 100
        self.recent_events = []
        self.max_events = 50

    def wait_natural(self, mu=30, sigma=10):
        """Simulates natural human reading time (Gaussian)"""
        wait = random.gauss(mu, sigma)
        return max(2, min(wait, 120)) # Clamped between 2s and 2m

    def generate_cid(self) -> str:
        return f"{random.randint(100000000, 999999999)}.{int(time.time())}"

    def generate_sid(self) -> str:
        return str(int(time.time()))

    async def send_hit(self, session: aiohttp.ClientSession, tid: str, cid: str, sid: str, url: str, title: str, 
                        sct: int = 1, seg: int = 1, events: List[str] = None, referrer: str = "", 
                        fingerprint: Dict[str, Any] = None, proxy: str = None, project_id: str = None):
        
        primary_event = "page_view"
        if events and "session_start" in events: primary_event = "session_start"
        
        headers = {
            "Accept": "*/*",
            "User-Agent": fingerprint.get("ua") if fingerprint else random.choice(ALL_UAS),
            "Accept-Language": fingerprint.get("ul") if fingerprint else random.choice(LANGUAGES),
        }
        if referrer: headers["Referer"] = referrer

        params = {
            "v": "2",
            "tid": tid,
            "cid": cid,
            "sid": sid,
            "sct": str(sct),
            "seg": str(seg),
            "dl": url,
            "dt": title,
            "en": primary_event,
            "_p": str(int(time.time() * 1000)),
        }
        if fingerprint:
            for k, v in fingerprint.items():
                if k not in ["ua", "ul"]: params[k] = v

        base_url_ga = "https://www.google-analytics.com/g/collect"
        
        try:
            async with session.get(base_url_ga, params=params, headers=headers, timeout=5, proxy=proxy) as response:
                status = "success" if response.status in [200, 204] else "failure"
                
                # Log to DB
                if project_id:
                    await self._db_log_hit_async(project_id, url, primary_event, status, proxy)
                    if status == "success":
                        if project_id not in self.stats: self.stats[project_id] = {"success": 0, "failure": 0, "total": 0}
                        self.stats[project_id]["success"] += 1
                    else:
                        self.stats[project_id]["failure"] += 1
                    self.stats[project_id]["total"] += 1
                
                return status == "success"
        except Exception as e:
            logger.error(f"GA Hit error: {e}")
            if project_id: await self._db_log_hit_async(project_id, url, primary_event, "error", proxy)
            return False

    async def _db_log_hit_async(self, project_id: str, url: str, event_type: str, status: str, proxy: str):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._db_log_hit, project_id, url, event_type, status, proxy)

    def _db_log_hit(self, project_id: str, url: str, event_type: str, status: str, proxy: str):
        try:
            db = database.SessionLocal()
            log = models.TrafficLog(
                project_id=project_id,
                url=url,
                event_type=event_type,
                status=status,
                proxy=proxy.split('@')[-1] if proxy else "Direct"
            )
            db.add(log)
            
            # Increment project counters if successful hit
            if status == "success" and event_type == "session_start":
                project = db.query(models.Project).filter(models.Project.id == project_id).first()
                if project:
                    project.hits_today += 1
                    project.total_hits += 1
            
            db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Failed to log hit: {e}")

    async def simulate_visitor(self, session: aiohttp.ClientSession, project: models.Project, proxies: List[Dict[str, Any]] = None):
        settings = project.settings
        
        # 1. Targeting Logic
        target_url = settings.get("targetUrl") or "https://example.com"
        tid = settings.get("ga4Tid") or "G-XXXXXXXXXX"
        
        # 2. Geo-Proxy logic
        geo_targets = settings.get("geoTargets", [])
        proxy_url = None
        if proxies:
            # Simple Geo-matching logic
            if geo_targets:
                chosen_geo = random.choices(geo_targets, weights=[g.get("percent", 1) for g in geo_targets])[0]
                country_code = chosen_geo.get("country")
                valid_proxies = [p for p in proxies if p.get("country") == country_code]
                if not valid_proxies: valid_proxies = proxies
                proxy_url = random.choice(valid_proxies).get("url")
            else:
                proxy_url = random.choice(proxies).get("url")

        # 3. Device Fingerprint
        device_split = settings.get("deviceSplit", 50) # % Mobile
        is_mobile = random.randint(1, 100) <= device_split
        ua = random.choice(MOBILE_UAS if is_mobile else DESKTOP_UAS)
        res = random.choice(SCREEN_RESOLUTIONS_MOBILE if is_mobile else SCREEN_RESOLUTIONS_DESKTOP)
        
        fingerprint = {"ua": ua, "sr": res, "ul": "en-us"}

        # 4. Referrer
        source_preset = settings.get("trafficSource", "direct")
        referrer = ""
        if source_preset == "social":
            referrer = random.choice(list(SOCIAL_REFERRERS.values()))
        elif source_preset == "organic":
            referrer = f"https://www.google.com/search?q={random.choice(['news', 'tech', 'updates'])}"

        # 5. CID (Returning vs New)
        returning_pct = settings.get("returningVisitorPct", 0)
        is_returning = random.randint(1, 100) <= returning_pct and project.id in self.cid_pool and self.cid_pool[project.id]
        
        if is_returning:
            cid = random.choice(self.cid_pool[project.id])
            sct = 2
            events = ["session_start"]
        else:
            cid = self.generate_cid()
            sct = 1
            events = ["first_visit", "session_start"]
            if project.id not in self.cid_pool: self.cid_pool[project.id] = []
            if len(self.cid_pool[project.id]) < self.max_cid_pool_size:
                self.cid_pool[project.id].append(cid)

        sid = self.generate_sid()

        # 6. Execution
        # Initial Hit
        await self.send_hit(session, tid, cid, sid, target_url, "Home", sct, events=events, referrer=referrer, fingerprint=fingerprint, proxy=proxy_url, project_id=project.id)
        
        # Internal Page Views (Funnel)
        funnel = settings.get("funnel", [])
        if funnel:
            for step in funnel:
                await asyncio.sleep(self.wait_natural())
                if not self.is_running: break
                url = step.get("url")
                title = step.get("title") or "Page"
                await self.send_hit(session, tid, cid, sid, url, title, sct, referrer=referrer, fingerprint=fingerprint, proxy=proxy_url, project_id=project.id)
        else:
            # Random deep link
            await asyncio.sleep(self.wait_natural())
            await self.send_hit(session, tid, cid, sid, f"{target_url}/about", "About Us", sct, referrer=referrer, fingerprint=fingerprint, proxy=proxy_url, project_id=project.id)

    async def run_for_project(self, project_id: str, intensity_multiplier: float = 1.0):
        """Runs a burst of visitors for a specific project"""
        db = database.SessionLocal()
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        if not project or project.status != "active":
            db.close()
            return

        # Fetch proxies
        proxies = db.query(models.Proxy).filter(models.Proxy.is_active == True).all()
        proxy_dicts = [{"url": p.url, "country": p.country} for p in proxies]
        db.close()

        # Calculate concurrency based on trafficSpeed (0-100)
        speed = project.settings.get("trafficSpeed", 50)
        concurrency = max(1, int((speed / 10) * intensity_multiplier))
        
        logger.info(f"Engine starting burst for Project {project.name} (Speed: {speed}, Concurrency: {concurrency})")
        
        async with aiohttp.ClientSession() as session:
            tasks = [self.simulate_visitor(session, project, proxy_dicts) for _ in range(concurrency)]
            await asyncio.gather(*tasks)

    def stop(self):
        self.is_running = False

ga_emu_engine = GAEmuEngine()
