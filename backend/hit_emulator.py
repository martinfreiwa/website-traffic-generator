import asyncio
import aiohttp
import random
import time
import urllib.parse
import logging
import datetime
import json
import re
from web_utils import TITLE_CACHE
import database
import models
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# More diverse and realistic User Agents
DESKTOP_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
]

MOBILE_UAS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
]

TABLET_UAS = [
    "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Tab S9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

SCREEN_RESOLUTIONS_DESKTOP = [
    "1920x1080",
    "1536x864",
    "1366x768",
    "1440x900",
    "1280x720",
    "2560x1440",
    "3840x2160",
]
SCREEN_RESOLUTIONS_MOBILE = [
    "390x844",
    "414x896",
    "360x800",
    "375x667",
    "393x851",
    "428x926",
]
SCREEN_RESOLUTIONS_TABLET = ["768x1024", "800x1280", "834x1194"]

SOCIAL_REFERRERS = {
    "Facebook": "https://l.facebook.com/l.php?u=",
    "Twitter": "https://t.co/",
    "Instagram": "https://www.instagram.com/",
    "LinkedIn": "https://www.linkedin.com/",
    "Reddit": "https://www.reddit.com/",
    "Pinterest": "https://www.pinterest.com/",
    "YouTube": "https://www.youtube.com/",
    "TikTok": "https://www.tiktok.com/",
}

ORGANIC_REFERRERS = {
    "Google": "https://www.google.com/search?q=",
    "Bing": "https://www.bing.com/search?q=",
    "Yahoo": "https://search.yahoo.com/search?p=",
    "DuckDuckGo": "https://duckduckgo.com/?q=",
}

ALL_UAS = DESKTOP_UAS + MOBILE_UAS + TABLET_UAS

LANGUAGES = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.8",
    "de-DE,de;q=0.9",
    "fr-FR,fr;q=0.9",
    "it-IT,it;q=0.9",
    "es-ES,es;q=0.9",
    "pt-BR,pt;q=0.9",
    "ja-JP,ja;q=0.9",
    "ko-KR,ko;q=0.9",
    "zh-CN,zh;q=0.9",
    "ru-RU,ru;q=0.9",
    "nl-NL,nl;q=0.9",
]

SEARCH_KEYWORDS = [
    "news",
    "latest news",
    "today",
    "breaking",
    "updates",
    "world news",
    "sports",
    "technology",
    "business",
    "entertainment",
    "politics",
]


class GAEmuEngine:
    def __init__(self):
        self.is_running = False
        self.stats = {}
        self.cid_pool = {}
        self.max_cid_pool_size = 500
        self.recent_events = []
        self.max_events = 50

    def wait_natural(self, mu=30, sigma=10):
        """Simulates natural human reading time (Gaussian)"""
        wait = random.gauss(mu, sigma)
        return max(2, min(wait, 120))

    def generate_cid(self) -> str:
        """Generate a realistic GA4 client ID (format: random.random id)"""
        return f"{random.random():.16f}{random.random():.16f}"[:44]

    def generate_sid(self) -> str:
        """Generate session ID"""
        return str(int(time.time() * 1000))

    def generate_gclId(self) -> str:
        """Generate gclId (Google Click ID) for tracking"""
        return f"GC{''.join([str(random.randint(0, 9)) for _ in range(20)])}"

    async def send_hit(
        self,
        session: aiohttp.ClientSession,
        tid: str,
        cid: str,
        sid: str,
        url: str,
        title: str,
        sct: int = 1,
        seg: int = 1,
        events: List[str] = None,
        referrer: str = "",
        fingerprint: Dict[str, Any] = None,
        proxy: str = None,
        project_id: str = None,
        page_path: str = "/",
        engagement_time_msec: int = None,
    ):
        primary_event = "page_view"
        if events and "session_start" in events:
            primary_event = "session_start"

        # Build comprehensive headers that look like a real browser
        ua = fingerprint.get("ua") if fingerprint else random.choice(ALL_UAS)

        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": fingerprint.get("ul")
            if fingerprint
            else random.choice(LANGUAGES),
            "User-Agent": ua,
            "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            "sec-ch-ua-mobile": "?1" if "Mobile" in ua else "?0",
            "sec-ch-ua-platform": '"iOS"'
            if "iPhone" in ua or "iPad" in ua
            else '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none" if not referrer else "cross-site",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        }

        if referrer:
            headers["Referer"] = referrer

        # Build comprehensive GA4 parameters
        params = {
            "v": "2",
            "tid": tid,
            "cid": cid,
            "sid": sid,
            "sct": str(sct),
            "seg": str(seg),
            "dl": url,
            "dr": referrer[:500] if referrer else "",  # Document referrer
            "dt": title[:500],  # Document title
            "en": primary_event,
            "_p": str(int(time.time() * 1000)),
            "ul": fingerprint.get("ul", "en-us") if fingerprint else "en-us",
            "sr": fingerprint.get("sr", "1920x1080") if fingerprint else "1920x1080",
            "vp": fingerprint.get("vp", "1920x1080")
            if fingerprint
            else "1920x1080",  # Viewport
            "de": "UTF-8",  # Document encoding
            "cn": "organic",  # Campaign name
            "cm": "organic",  # Campaign medium
            "cs": "google",  # Campaign source
            "ck": random.choice(SEARCH_KEYWORDS),  # Campaign term
            "cc": "organic",  # Campaign content
            "gclid": self.generate_gclId(),  # Google Click ID
            "_et": str(
                engagement_time_msec or random.randint(1000, 30000)
            ),  # Engagement time
            "tid": tid,
        }

        if fingerprint:
            for k, v in fingerprint.items():
                if k not in ["ua", "ul"]:
                    params[k] = v

        base_url_ga = "https://www.google-analytics.com/g/collect"

        try:
            async with session.get(
                base_url_ga,
                params=params,
                headers=headers,
                timeout=10,
                proxy=proxy,
                allow_redirects=True,
            ) as response:
                status = "success" if response.status in [200, 204] else "failure"

                if project_id:
                    await self._db_log_hit_async(
                        project_id, url, primary_event, status, proxy
                    )
                    if project_id not in self.stats:
                        self.stats[project_id] = {
                            "success": 0,
                            "failure": 0,
                            "total": 0,
                        }
                    if status == "success":
                        self.stats[project_id]["success"] += 1
                    else:
                        self.stats[project_id]["failure"] += 1
                    self.stats[project_id]["total"] += 1

                return status == "success"
        except Exception as e:
            logger.error(f"GA Hit error: {e}")
            if project_id:
                await self._db_log_hit_async(
                    project_id, url, primary_event, "error", proxy
                )
            return False

    async def _db_log_hit_async(
        self, project_id: str, url: str, event_type: str, status: str, proxy: str
    ):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None, self._db_log_hit, project_id, url, event_type, status, proxy
        )

    def _db_log_hit(
        self, project_id: str, url: str, event_type: str, status: str, proxy: str
    ):
        try:
            db = database.SessionLocal()
            log = models.TrafficLog(
                project_id=project_id,
                url=url,
                event_type=event_type,
                status=status,
                proxy=proxy.split("@")[-1] if proxy else "Direct",
            )
            db.add(log)

            # Increment project counters if successful hit
            if status == "success" and event_type == "session_start":
                project = (
                    db.query(models.Project)
                    .filter(models.Project.id == project_id)
                    .first()
                )
                if project:
                    project.hits_today += 1
                    project.total_hits += 1

            db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Failed to log hit: {e}")

    async def simulate_visitor(
        self,
        session: aiohttp.ClientSession,
        project: models.Project,
        proxies: List[Dict[str, Any]] = None,
    ):
        settings = project.settings

        # 1. Targeting Logic
        target_url = (
            settings.get("targetUrl")
            or settings.get("target_url")
            or "https://example.com"
        )
        tid = settings.get("ga4Tid") or "G-XXXXXXXXXX"

        # 2. Geo-Proxy logic
        geo_targets = settings.get("geoTargets", [])
        proxy_url = None
        if proxies:
            # Simple Geo-matching logic
            if geo_targets:
                chosen_geo = random.choices(
                    geo_targets, weights=[g.get("percent", 1) for g in geo_targets]
                )[0]
                country_code = chosen_geo.get("country")
                valid_proxies = [p for p in proxies if p.get("country") == country_code]
                if not valid_proxies:
                    valid_proxies = proxies
                proxy_url = random.choice(valid_proxies).get("url")
            else:
                proxy_url = random.choice(proxies).get("url")

        # 3. Device Fingerprint
        device_split = settings.get("deviceSplit", 50)  # % Mobile
        is_mobile = random.randint(1, 100) <= device_split
        ua = random.choice(MOBILE_UAS if is_mobile else DESKTOP_UAS)
        res = random.choice(
            SCREEN_RESOLUTIONS_MOBILE if is_mobile else SCREEN_RESOLUTIONS_DESKTOP
        )

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
        is_returning = (
            random.randint(1, 100) <= returning_pct
            and project.id in self.cid_pool
            and self.cid_pool[project.id]
        )

        if is_returning:
            cid = random.choice(self.cid_pool[project.id])
            sct = 2
            events = ["session_start"]
        else:
            cid = self.generate_cid()
            sct = 1
            events = ["first_visit", "session_start"]
            if project.id not in self.cid_pool:
                self.cid_pool[project.id] = []
            if len(self.cid_pool[project.id]) < self.max_cid_pool_size:
                self.cid_pool[project.id].append(cid)

        sid = self.generate_sid()

        # 6. Execution
        # Initial Hit - strip trailing slash to avoid double slashes
        clean_target_url = target_url.rstrip("/")
        await self.send_hit(
            session,
            tid,
            cid,
            sid,
            clean_target_url,
            "Home",
            sct,
            events=events,
            referrer=referrer,
            fingerprint=fingerprint,
            proxy=proxy_url,
            project_id=project.id,
        )

        # Internal Page Views (Funnel)
        funnel = settings.get("funnel", [])
        if funnel:
            for step in funnel:
                await asyncio.sleep(self.wait_natural())
                if not self.is_running:
                    break
                url = step.get("url")
                title = step.get("title") or "Page"
                await self.send_hit(
                    session,
                    tid,
                    cid,
                    sid,
                    url,
                    title,
                    sct,
                    referrer=referrer,
                    fingerprint=fingerprint,
                    proxy=proxy_url,
                    project_id=project.id,
                )
        else:
            # Random deep link
            await asyncio.sleep(self.wait_natural())
            # Strip trailing slash from target_url to avoid double slashes
            clean_url = target_url.rstrip("/")
            await self.send_hit(
                session,
                tid,
                cid,
                sid,
                f"{clean_url}/about",
                "About Us",
                sct,
                referrer=referrer,
                fingerprint=fingerprint,
                proxy=proxy_url,
                project_id=project.id,
            )

    async def run_for_project(self, project_id: str, intensity_multiplier: float = 1.0):
        """Runs a burst of visitors for a specific project"""
        db = database.SessionLocal()
        project = (
            db.query(models.Project).filter(models.Project.id == project_id).first()
        )
        if not project or project.status != "active":
            db.close()
            return

        # Fetch proxies
        proxies = db.query(models.Proxy).filter(models.Proxy.is_active == True).all()
        proxy_dicts = [{"url": p.url, "country": p.country} for p in proxies]
        db.close()

        # Calculate concurrency based on daily_limit
        daily_limit = project.daily_limit or 1000
        hits_per_minute = (daily_limit / 24) / 60
        concurrency = max(1, int(hits_per_minute * intensity_multiplier * 2))

        logger.info(
            f"Engine starting burst for Project {project.name} (Daily: {daily_limit}, Concurrency: {concurrency})"
        )

        async with aiohttp.ClientSession() as session:
            tasks = [
                self.simulate_visitor(session, project, proxy_dicts)
                for _ in range(concurrency)
            ]
            await asyncio.gather(*tasks)

    def stop(self):
        self.is_running = False


ga_emu_engine = GAEmuEngine()
