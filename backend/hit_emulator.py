import asyncio
import aiohttp
import random
import time
import urllib.parse
import logging
from web_utils import TITLE_CACHE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
]

class GAEmuEngine:
    def __init__(self):
        self.is_running = False
        self.stats = {} # Per-target stats
        self.cid_pool = [] # List of previously used CIDs
        self.max_cid_pool_size = 1000

    def generate_cid(self):
        return f"{random.randint(100000000, 999999999)}.{int(time.time())}"

    def generate_sid(self):
        return str(int(time.time()))

    async def send_hit(self, session, tid, cid, sid, url, title, sct=1, seg=1, events=None, referrer=""):
        logger.debug(f"Sending hit: {tid} | CID: {cid} | Event: page_view | Ref: {referrer}")
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
            "en": "page_view",
            "_p": str(int(time.time() * 1000)),
        }
        
        if referrer:
            params["dr"] = referrer
            
        # Add extra events if provided (e.g., first_visit, session_start)
        # Note: GA4 allows batching events in one request, but for simplicity we can send them as separate hits or extra params
        # Real GA4 sends events in a JSON body for v2, but the collect endpoint supports en=event_name
        
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
        }
        if referrer:
            headers["Referer"] = referrer

        base_url = "https://www.google-analytics.com/g/collect"
        target_url = urllib.parse.urlparse(url).scheme + "://" + urllib.parse.urlparse(url).netloc
        if target_url not in self.stats:
            self.stats[target_url] = {"success": 0, "failure": 0, "total": 0}

        try:
            async with session.get(base_url, params=params, headers=headers, timeout=5) as response:
                if response.status == 200 or response.status == 204:
                    self.stats[target_url]["success"] += 1
                    
                    # If we sent extra events, we simulate them as part of the total
                    if events:
                        for event_name in events:
                            # Send a quick hit for each additional event
                            event_params = params.copy()
                            event_params["en"] = event_name
                            event_params["_p"] = str(int(time.time() * 1000) + 1)
                            await session.get(base_url, params=event_params, headers=headers, timeout=2)
                            self.stats[target_url]["total"] += 1
                            self.stats[target_url]["success"] += 1
                            
                    return True
                else:
                    self.stats[target_url]["failure"] += 1
                    return False
        except Exception as e:
            logger.error(f"Error sending GA hit: {e}")
            self.stats[target_url]["failure"] += 1
            return False
        finally:
            self.stats[target_url]["total"] += 1

    async def simulate_visitor(self, session, target_config, returning_visitor_pct=0, bounce_rate_pct=0, referrer=""):
        """Simulates 1 visitor with sequential funnel or random page views, with advanced GA4 parameters"""
        tid = target_config["tid"]
        base_url = target_config["url"]
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
        await self.send_hit(session, tid, cid, sid, base_url, base_title, sct=sct, events=events, referrer=referrer)
        
        if will_bounce:
            return # Bounce: visitor leaves after first page
            
        # 4. Stay engaged
        await asyncio.sleep(random.uniform(5, 15))
        if not self.is_running: return
        
        # Send engagement event if they stay
        await self.send_hit(session, tid, cid, sid, base_url, f"{base_title} (Engaged)", sct=sct, events=["user_engagement", "scroll"], referrer=referrer)

        if funnel:
            # Funnel-based navigation
            for i, step in enumerate(funnel):
                if not self.is_running: break
                
                # Funnel steps are now dicts with url and title
                url = step.get("url") if isinstance(step, dict) else step
                title = step.get("title") if isinstance(step, dict) else f"Funnel Step {i+1}"
                if not title: title = f"Funnel Step {i+1}"
                
                await asyncio.sleep(random.uniform(5, 15))
                await self.send_hit(session, tid, cid, sid, url, title, sct=sct, referrer=referrer)
                
                # Randomly send scroll/engagement for funnel steps too
                if random.random() > 0.5:
                    await self.send_hit(session, tid, cid, sid, url, title, sct=sct, events=["scroll"], referrer=referrer)
        else:
            # Random exploration
            num_pages = random.randint(1, 4)
            for i in range(1, num_pages):
                if not self.is_running: break
                await asyncio.sleep(random.uniform(5, 20))
                
                page_type = random.choice(["article", "product", "about", "contact"])
                page_id = random.randint(1, 5000)
                url = f"{base_url}/{page_type}-{page_id}"
                # Try to get title from cache if available
                title = TITLE_CACHE.get(url, f"{page_type.capitalize()} {page_id}")
                
                await self.send_hit(session, tid, cid, sid, url, title, sct=sct, referrer=referrer)
                if random.random() > 0.7:
                    await self.send_hit(session, tid, cid, sid, url, title, sct=sct, events=["scroll"], referrer=referrer)

    async def run_simulation(self, targets, visitors_per_min, duration_mins=1, returning_visitor_pct=0, bounce_rate_pct=0, referrer=""):
        self.is_running = True
        self.stats = {t["url"]: {"success": 0, "failure": 0, "total": 0} for t in targets}
        
        total_visitors = int(visitors_per_min * duration_mins)
        logger.info(f"Starting GA Emulation: {total_visitors} visitors over {duration_mins} mins (Returning: {returning_visitor_pct}%, Bounce: {bounce_rate_pct}%, Ref: {referrer})")
        
        # Arrival rate control
        delay_between_visitors = 60.0 / visitors_per_min
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for i in range(total_visitors):
                if not self.is_running:
                    logger.info("Simulation stopped early by flag")
                    break
                
                target = random.choice(targets)
                tasks.append(asyncio.create_task(self.simulate_visitor(session, target, returning_visitor_pct, bounce_rate_pct, referrer)))
                
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
