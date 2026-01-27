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

SCREEN_RESOLUTIONS = [
    "1920x1080", "1536x864", "1366x768", "1440x900", "1280x720",
    "390x844", "414x896", "360x800", "375x667"
]

LANGUAGES = ["en-US,en;q=0.9", "en-GB,en;q=0.8", "de-DE,de;q=0.9", "fr-FR,fr;q=0.9", "it-IT,it;q=0.9", "es-ES,es;q=0.9"]

class GAEmuEngine:
    def __init__(self):
        self.is_running = False
        self.stats = {} # Per-target stats
        self.cid_pool = [] # List of previously used CIDs
        self.max_cid_pool_size = 1000
        self.recent_events = []
        self.max_events = 50

    def wait_natural(self, mu=45, sigma=15):
        """Simulates natural human reading time between 15s and 3m (Gaussian)"""
        wait = random.gauss(mu, sigma)
        return max(5, min(wait, 180)) # Clamped between 5s and 3m

    def generate_cid(self):
        return f"{random.randint(100000000, 999999999)}.{int(time.time())}"

    def generate_sid(self):
        return str(int(time.time()))

    async def send_hit(self, session, tid, cid, sid, url, title, sct=1, seg=1, events=None, referrer="", fingerprint=None, proxy=None, is_dry_run=False, stat_key=None, project_id=None):
        # Determine the primary event name
        primary_event = "page_view"
        if events and "visibility_hidden" in events: primary_event = "visibility_hidden"
        elif events and "visibility_visible" in events: primary_event = "visibility_visible"
        elif events and "user_engagement" in events: primary_event = "user_engagement"

        logger.debug(f"Sending hit: {tid} | CID: {cid} | Event: {primary_event} | Proxy: {'Yes' if proxy else 'No'} {'[DRY RUN]' if is_dry_run else ''}")
        
        # Record event
        event_entry = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "tid": tid,
            "url": url,
            "title": title,
            "proxy": proxy.split('@')[-1] if proxy else "Direct",
            "type": primary_event
        }
        self.recent_events.insert(0, event_entry)
        if len(self.recent_events) > self.max_events:
            self.recent_events.pop()

        # Basic hit parameters
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
            params.update(fingerprint)
        
        if referrer:
            params["dr"] = referrer
            
        # Add extra events if provided (e.g., first_visit, session_start)
        # Note: GA4 allows batching events in one request, but for simplicity we can send them as separate hits or extra params
        # Real GA4 sends events in a JSON body for v2, but the collect endpoint supports en=event_name
        
        headers = {
            "Accept": "*/*",
        }
        if referrer:
            headers["Referer"] = referrer
            
        if fingerprint and "ua" in fingerprint:
            headers["User-Agent"] = fingerprint["ua"]
        else:
            headers["User-Agent"] = random.choice(ALL_UAS)
            
        if fingerprint and "ul" in fingerprint:
            headers["Accept-Language"] = fingerprint["ul"]
        else:
            headers["Accept-Language"] = random.choice(LANGUAGES)

        base_url_ga = "https://www.google-analytics.com/g/collect"
        
        # Determine which key to use for stats
        target_key = stat_key
        if not target_key:
            parsed = urllib.parse.urlparse(url)
            target_key = f"{parsed.scheme}://{parsed.netloc}"

        if target_key not in self.stats:
            self.stats[target_key] = {"success": 0, "failure": 0, "total": 0}

        def record_in_db(status):
            if not project_id: return
            try:
                db = database.SessionLocal()
                log = models.TrafficLog(
                    project_id=project_id,
                    url=url,
                    event_type=primary_event,
                    status=status,
                    proxy=proxy.split('@')[-1] if proxy else "Direct",
                    tid=tid
                )
                db.add(log)
                db.commit()
                db.close()
            except Exception as e:
                logger.error(f"Failed to log hit to DB: {e}")

        if is_dry_run:
            self.stats[target_key]["success"] += 1
            record_in_db("success")
            if events:
                for _ in events:
                    self.stats[target_key]["total"] += 1
                    self.stats[target_key]["success"] += 1
            return True

        try:
            async with session.get(base_url_ga, params=params, headers=headers, timeout=5, proxy=proxy) as response:
                if response.status == 200 or response.status == 204:
                    self.stats[target_key]["success"] += 1
                    record_in_db("success")
                    
                    # If we sent extra events, we simulate them as part of the total
                    if events:
                        for event_name in events:
                            # Send a quick hit for each additional event
                            event_params = params.copy()
                            event_params["en"] = event_name
                            event_params["_p"] = str(int(time.time() * 1000) + 1)
                            await session.get(base_url_ga, params=event_params, headers=headers, timeout=2, proxy=proxy)
                            self.stats[target_key]["total"] += 1
                            self.stats[target_key]["success"] += 1
                            
                    return True
                else:
                    self.stats[target_key]["failure"] += 1
                    record_in_db("failure")
                    return False
        except Exception as e:
            logger.error(f"Error sending GA hit: {e}")
            self.stats[target_key]["failure"] += 1
            record_in_db("error")
            return False
        finally:
            self.stats[target_key]["total"] += 1

    async def simulate_visitor(self, session, target_config, returning_visitor_pct=0, bounce_rate_pct=0, referrer="", proxies=None, utm_tags=None, device_dist=None, source_preset="direct", target_country=None, target_state=None, target_city=None, is_dry_run=False, tier="professional", project_id=None):
        """Simulates 1 visitor with sequential funnel or random page views, with advanced GA4 parameters"""
        # Feature Gating
        if tier == "economy":
            target_country = None # No Geo-targeting in Economy
            target_state = None
            target_city = None
            utm_tags = None # No UTM builder in Economy
            
        # Filter proxies by country & city if specified
        valid_proxies = proxies
        if proxies:
            if target_country:
                valid_proxies = [p for p in valid_proxies if p.get("country") == target_country]
            if target_state and tier == "professional":
                state_proxies = [p for p in valid_proxies if p.get("state") == target_state]
                if state_proxies: valid_proxies = state_proxies
            if target_city and tier == "professional": # City-level precision only in Professional
                city_proxies = [p for p in valid_proxies if p.get("city") == target_city]
                if city_proxies: valid_proxies = city_proxies
            
            # Fallback to any proxy if none match filtering criteria
            if not valid_proxies and proxies: valid_proxies = proxies
            
        proxy_obj = random.choice(valid_proxies) if valid_proxies else None
        proxy = proxy_obj.get("url") if proxy_obj else None

        # Pick referrer based on preset
        actual_referrer = referrer
        if source_preset == "social":
            actual_referrer = random.choice(list(SOCIAL_REFERRERS.values()))
        elif source_preset == "organic":
            engine = random.choice(list(ORGANIC_REFERRERS.keys()))
            prefix = ORGANIC_REFERRERS[engine]
            # Simple keyword simulation
            kw = random.choice(["news", "article", "today", "updates"])
            actual_referrer = f"{prefix}{kw}"
        
        # Pick device type based on distribution
        device_type = "desktop"
        if device_dist:
            rand = random.randint(1, 100)
            if rand <= device_dist.get("mobile", 0): device_type = "mobile"
            elif rand <= device_dist.get("mobile", 0) + device_dist.get("tablet", 0): device_type = "tablet"
            
        if device_type == "mobile":
            ua = random.choice(MOBILE_UAS)
            res = random.choice(SCREEN_RESOLUTIONS_MOBILE)
        elif device_type == "tablet":
            ua = random.choice(TABLET_UAS)
            res = random.choice(SCREEN_RESOLUTIONS_MOBILE) # High density
        else:
            ua = random.choice(DESKTOP_UAS)
            res = random.choice(SCREEN_RESOLUTIONS_DESKTOP)

        if tier == "economy":
            # Override for economy: Fixed generic User-Agent
            ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            res = "1920x1080"

        lang = random.choice(LANGUAGES)
        
        # Enhanced Fingerprinting Variables
        # Randomize some hardware variables for realism
        hardware_concurrency = random.choice([4, 8, 12, 16])
        device_memory = random.choice([4, 8, 16])
        
        fingerprint = {
            "ua": ua,
            "sr": res,
            "vp": res, # Viewport usually same as screen here
            "sd": "24",
            "ul": lang.split(',')[0].lower(),
            "je": "0", # Java Enabled
            "hc": str(hardware_concurrency), # Hardware Concurrency
            "dm": str(device_memory), # Device Memory
        }
        
        tid = target_config["tid"]
        base_url = target_config["url"]
        
        # Inject UTM tags if provided with Dynamic Variable Injection
        if utm_tags:
            parsed = urllib.parse.urlparse(base_url)
            query = dict(urllib.parse.parse_qsl(parsed.query))
            
            # Resolve Dynamic Placeholders
            placeholders = {
                "{{random_keyword}}": random.choice(["analytics", "growth", "performance", "optimization", "metrics"]),
                "{{timestamp}}": str(int(time.time())),
                "{{device_type}}": device_type,
                "{{country}}": target_country or "unknown"
            }
            
            for k, v in utm_tags.items():
                if v:
                    # Replace placeholders in the value
                    resolved_v = v
                    for placeholder, replacement in placeholders.items():
                        resolved_v = resolved_v.replace(placeholder, replacement)
                    query[f"utm_{k}"] = resolved_v
            base_url = urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(query)))

        base_title = target_config.get("title") or "Ciclone, Musumeci Dichiarata emergenza nazionale Sicilia, Sardegna e Calabria"
        funnel = target_config.get("funnel", [])
        
        # 1. Determine if this is a returning visitor
        is_returning = random.randint(1, 100) <= returning_visitor_pct and len(self.cid_pool) > 0
        
        if is_returning:
            cid = random.choice(self.cid_pool)
            sct = random.randint(2, 5) # Returning user, so session count > 1
            # Returning user still starts a new session if enough time passed
            events = ["session_start"] 
        else:
            cid = self.generate_cid()
            sct = 1
            events = ["first_visit", "session_start"]
            # Add to pool for future returning sessions
            if len(self.cid_pool) < self.max_cid_pool_size:
                self.cid_pool.append(cid)
            elif self.cid_pool:
                self.cid_pool[random.randint(0, len(self.cid_pool)-1)] = cid
        
        sid = self.generate_sid()
        
        # 2. Determine if this session will bounce
        will_bounce = random.randint(1, 100) <= bounce_rate_pct
        
        # 3. Initial Page View
        # Update hits_today count in DB for the project (counting session starts)
        if project_id:
            try:
                db = database.SessionLocal()
                proj = db.query(models.Project).filter(models.Project.id == project_id).first()
                if proj:
                    proj.hits_today += 1
                    db.commit()
                db.close()
            except Exception as e:
                logger.error(f"Failed to increment hits_today: {e}")

        await self.send_hit(session, tid, cid, sid, base_url, base_title, sct=sct, events=events, referrer=actual_referrer, fingerprint=fingerprint, proxy=proxy, is_dry_run=is_dry_run, stat_key=target_config["url"], project_id=project_id)
        
        if will_bounce:
            return # Bounce: visitor leaves after first page
            
        # 4. Stay engaged with Idle/Active cycles
        # Simulate initial engagement
        await asyncio.sleep(self.wait_natural(15, 5))
        if not self.is_running: return
        
        # Send engagement event
        await self.send_hit(session, tid, cid, sid, base_url, f"{base_title} (Engaged)", sct=sct, events=["user_engagement", "scroll", "click"], referrer=actual_referrer, fingerprint=fingerprint, proxy=proxy, is_dry_run=is_dry_run, stat_key=target_config["url"], project_id=project_id)

        # Simulate tab switching / backgrounding (Idle State Transition)
        if random.random() > 0.6:
            # User "leaves" the tab
            await self.send_hit(session, tid, cid, sid, base_url, base_title, sct=sct, events=["visibility_hidden"], referrer=actual_referrer, fingerprint=fingerprint, proxy=proxy, is_dry_run=is_dry_run, stat_key=target_config["url"], project_id=project_id)
            idle_time = random.uniform(30, 120) # Stay idle for 30s - 2m
            logger.debug(f"Visitor {cid} gone idle for {idle_time:.1f}s")
            await asyncio.sleep(idle_time)
            if not self.is_running: return
            # User "returns" to the tab
            await self.send_hit(session, tid, cid, sid, base_url, base_title, sct=sct, events=["visibility_visible"], referrer=actual_referrer, fingerprint=fingerprint, proxy=proxy, is_dry_run=is_dry_run, stat_key=target_config["url"], project_id=project_id)
            await asyncio.sleep(random.uniform(5, 15)) # Brief activity after return

        if funnel:
            # Funnel-based navigation
            for i, step in enumerate(funnel):
                if not self.is_running: break
                
                # Funnel steps are now dicts with url and title
                url = step.get("url") if isinstance(step, dict) else step
                title = step.get("title") if isinstance(step, dict) else f"Funnel Step {i+1}"
                if not title: title = f"Funnel Step {i+1}"
                
                await asyncio.sleep(self.wait_natural(40, 10))
                if not self.is_running: break
                await self.send_hit(session, tid, cid, sid, url, title, sct=sct, referrer=actual_referrer, fingerprint=fingerprint, proxy=proxy, is_dry_run=is_dry_run, stat_key=target_config["url"], project_id=project_id)
                
                # Randomly send scroll/engagement for funnel steps too
                if random.random() > 0.5:
                    await self.send_hit(session, tid, cid, sid, url, title, sct=sct, events=["scroll"], referrer=actual_referrer, fingerprint=fingerprint, proxy=proxy, is_dry_run=is_dry_run, stat_key=target_config["url"], project_id=project_id)
        else:
            # Random exploration
            num_pages = random.randint(1, 4)
            for i in range(1, num_pages):
                if not self.is_running: break
                await asyncio.sleep(self.wait_natural(30, 10))
                
                page_type = random.choice(["article", "product", "about", "contact"])
                page_id = random.randint(1, 5000)
                url = f"{base_url}/{page_type}-{page_id}"
                # Try to get title from cache if available
                title = TITLE_CACHE.get(url, f"{page_type.capitalize()} {page_id}")
                
                if not self.is_running: break
                await self.send_hit(session, tid, cid, sid, url, title, sct=sct, referrer=actual_referrer, fingerprint=fingerprint, proxy=proxy, is_dry_run=is_dry_run, stat_key=target_config["url"], project_id=project_id)
                if random.random() > 0.7:
                    await self.send_hit(session, tid, cid, sid, url, title, sct=sct, events=["scroll"], referrer=actual_referrer, fingerprint=fingerprint, proxy=proxy, is_dry_run=is_dry_run, stat_key=target_config["url"], project_id=project_id)

    async def run_simulation(self, targets, visitors_per_min, duration_mins=1, returning_visitor_pct=0, bounce_rate_pct=0, referrer="", proxies=None, utm_tags=None, device_dist=None, source_preset="direct", target_country=None, target_state=None, target_city=None, is_dry_run=False, tier="professional", total_visitor_count=None, project_id=None):
        self.is_running = True
        self.stats = {t["url"]: {"success": 0, "failure": 0, "total": 0} for t in targets}
        
        if total_visitor_count is not None:
            total_visitors = int(total_visitor_count)
            # Recalculate duration just for info logging
            info_duration = f"approx {(total_visitors / visitors_per_min):.1f}"
        else:
            total_visitors = int(visitors_per_min * duration_mins)
            info_duration = str(duration_mins)
            
        logger.info(f"Starting GA Emulation: {total_visitors} visitors over {info_duration} mins (Proxies: {len(proxies) if proxies else 0})")
        
        # Arrival rate control
        delay_between_visitors = 60.0 / visitors_per_min
        
        connector = aiohttp.TCPConnector(limit=10000) # Support high scale
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = []
            for i in range(total_visitors):
                if not self.is_running:
                    logger.info("Simulation stopped early by flag")
                    break
                
                # Check if we reached the project's daily limit in real-time
                if project_id:
                    db = database.SessionLocal()
                    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
                    if proj and proj.daily_visitor_limit and proj.hits_today >= proj.daily_visitor_limit:
                        logger.info(f"Daily limit reached for project {project_id} during simulation. Stopping.")
                        db.close()
                        break
                    db.close()

                target = random.choice(targets)
                tasks.append(asyncio.create_task(self.simulate_visitor(session, target, returning_visitor_pct, bounce_rate_pct, referrer, proxies, utm_tags, device_dist, source_preset, target_country, target_state, target_city, is_dry_run, tier, project_id=project_id)))
                
                # Stagger visitors with slight jitter
                jitter = random.uniform(0.7, 1.3)
                await asyncio.sleep(delay_between_visitors * jitter)
            
            if tasks:
                logger.info(f"All {len(tasks)} visitor sessions started, waiting for completion...")
                await asyncio.gather(*tasks)
        
        self.is_running = False
        logger.info(f"GA Emulation finished. Final Stats: {self.stats}")

    def stop(self):
        self.is_running = False

ga_emu_engine = GAEmuEngine()
