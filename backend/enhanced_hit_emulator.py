import asyncio
import aiohttp
import random
import time
import urllib.parse
import logging
import datetime
import math
import re

from web_utils import TITLE_CACHE, fetch_page_title
import database
import models
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== ENHANCED USER AGENTS ====================

DESKTOP_CHROME_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]

DESKTOP_FIREFOX_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
]

DESKTOP_SAFARI_UAS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
]

DESKTOP_EDGE_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
]

MOBILE_CHROME_UAS = [
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
]

MOBILE_SAFARI_UAS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
]

TABLET_UAS = [
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Samsung Galaxy S7 Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
]

# Browser distribution for realistic selection
BROWSER_WEIGHTS = {"chrome": 0.65, "firefox": 0.15, "safari": 0.15, "edge": 0.05}

# ==================== SCREEN RESOLUTIONS ====================

SCREEN_RESOLUTIONS_DESKTOP = [
    "1920x1080",
    "1536x864",
    "1366x768",
    "1440x900",
    "1280x720",
    "2560x1440",
    "3840x2160",
    "1680x1050",
    "1600x900",
]

SCREEN_RESOLUTIONS_MOBILE = [
    "390x844",
    "414x896",
    "360x800",
    "375x667",
    "393x851",
    "360x780",
    "428x926",
    "390x844",
]

SCREEN_RESOLUTIONS_TABLET = ["768x1024", "800x1280", "601x962", "834x1194", "820x1180"]

# ==================== ENHANCED TRAFFIC SOURCES ====================

SOCIAL_REFERRERS = {
    "Facebook": "https://l.facebook.com/l.php",
    "Twitter": "https://t.co/",
    "Instagram": "https://www.instagram.com/",
    "LinkedIn": "https://www.linkedin.com/",
    "Reddit": "https://www.reddit.com/",
    "Pinterest": "https://www.pinterest.com/",
    "TikTok": "https://www.tiktok.com/",
    "YouTube": "https://www.youtube.com/",
}

ORGANIC_REFERRERS = {
    "Google": "https://www.google.com/search?q=",
    "Bing": "https://www.bing.com/search?q=",
    "Yahoo": "https://search.yahoo.com/search?p=",
    "DuckDuckGo": "https://duckduckgo.com/?q=",
}

# New: Chatbot Sources
CHATBOT_REFERRERS = {
    "ChatGPT": "https://chat.openai.com/",
    "Perplexity": "https://www.perplexity.ai/",
    "Claude": "https://claude.ai/",
    "Gemini": "https://gemini.google.com/",
    "Copilot": "https://copilot.microsoft.com/",
    "MetaAI": "https://www.meta.ai/",
    "Mistral": "https://chat.mistral.ai/",
    "Groq": "https://groq.com/",
}

# New: Messenger Sources
MESSENGER_REFERRERS = {
    "WhatsApp": "https://web.whatsapp.com/",
    "Telegram": "https://web.telegram.org/",
    "WeChat": "https://web.wechat.com/",
    "Viber": "https://www.viber.com/",
    "Signal": "https://signal.org/",
}

# New: News Aggregators
NEWS_REFERRERS = {
    "GoogleNews": "https://news.google.com/",
    "Flipboard": "https://flipboard.com/",
    "AppleNews": "https://apple.news/",
    "Feedly": "https://feedly.com/",
    "Pocket": "https://getpocket.com/",
}

ALL_DESKTOP_UAS = (
    DESKTOP_CHROME_UAS + DESKTOP_FIREFOX_UAS + DESKTOP_SAFARI_UAS + DESKTOP_EDGE_UAS
)
ALL_MOBILE_UAS = MOBILE_CHROME_UAS + MOBILE_SAFARI_UAS
ALL_TABLET_UAS = TABLET_UAS
ALL_UAS = ALL_DESKTOP_UAS + ALL_MOBILE_UAS + ALL_TABLET_UAS

LANGUAGES = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.8",
    "de-DE,de;q=0.9",
    "fr-FR,fr;q=0.9",
    "it-IT,it;q=0.9",
    "es-ES,es;q=0.9",
    "pt-BR,pt;q=0.9",
    "nl-NL,nl;q=0.9",
    "ja-JP,ja;q=0.9",
    "ko-KR,ko;q=0.9",
    "zh-CN,zh;q=0.9",
    "ru-RU,ru;q=0.9",
]

# Search queries for organic traffic
SEARCH_QUERIES = [
    "news",
    "latest updates",
    "how to",
    "best practices",
    "tutorial",
    "guide",
    "review",
    "comparison",
    "tips",
    "tricks",
    "what is",
    "vs",
    "alternatives",
    "pricing",
    "features",
    "documentation",
    "tin tức",
    "công nghệ",
    "mới nhất",
    "hướng dẫn",
    "đánh giá",
    "mẹo",
    "thủ thuật",
]


class TokenBucket:
    def __init__(self, daily_limit: int):
        self.rate = daily_limit / 86400.0
        self.capacity = max(10, self.rate * 3600)
        self.tokens = self.capacity
        self.last_update = time.time()

    def update_rate(self, daily_limit: int):
        self.rate = daily_limit / 86400.0
        self.capacity = max(10, self.rate * 3600)

    def get_token_count(self) -> int:
        now = time.time()
        elapsed = now - self.last_update
        self.last_update = now
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        return int(self.tokens)

    def consume(self, count: int):
        if self.tokens >= count:
            self.tokens -= count
            return True
        return False


class GAEmuEngine:
    def __init__(self):
        self.is_running = True
        self.stats = {}
        self.cid_pool = {}
        self.max_cid_pool_size = 100
        self.buckets: Dict[str, TokenBucket] = {}
        self.engine_logs = []
        self.max_logs = 50
        self.session_stats: Dict[str, Dict] = {}  # Track session-level stats

    def _add_log(self, message: str, level: str = "info"):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        self.engine_logs.insert(
            0, {"timestamp": timestamp, "message": message, "level": level}
        )
        if len(self.engine_logs) > self.max_logs:
            self.engine_logs.pop()

    def parse_duration(self, duration_str: str) -> int:
        """Parses duration strings like '3 minutes', '60sec', '1 min' into seconds"""
        if not duration_str:
            return 30

        try:
            # Clean string
            s = duration_str.lower().strip()
            # Extract number
            val_match = re.search(r"(\d+)", s)
            if not val_match:
                return 30
            val = int(val_match.group(1))

            if "min" in s:
                return val * 60
            return val  # Default to seconds
        except Exception:
            return 30

    def wait_natural(self, mu=30, sigma=10):
        """Simulates natural human reading time (Gaussian)"""
        # Ensure mu is at least a few seconds
        mu = max(5, mu)
        wait = random.gauss(mu, sigma)
        return max(2, min(wait, mu * 2))  # Cap at 2x requested time for safety

    def generate_cid(self) -> str:
        return f"{random.randint(100000000, 999999999)}.{int(time.time())}"

    def generate_sid(self) -> str:
        return str(int(time.time()))

    def _get_browser_ua(
        self, device_type: str, browser_preference: Optional[str] = None
    ) -> str:
        """Get user agent based on device type and browser preference"""
        if browser_preference and browser_preference in BROWSER_WEIGHTS:
            browser = browser_preference
        else:
            browser = random.choices(
                list(BROWSER_WEIGHTS.keys()), weights=list(BROWSER_WEIGHTS.values())
            )[0]

        if device_type == "mobile":
            if browser == "safari":
                return random.choice(MOBILE_SAFARI_UAS)
            else:
                return random.choice(MOBILE_CHROME_UAS)
        elif device_type == "tablet":
            return random.choice(TABLET_UAS)
        else:  # desktop
            if browser == "chrome":
                return random.choice(DESKTOP_CHROME_UAS)
            elif browser == "firefox":
                return random.choice(DESKTOP_FIREFOX_UAS)
            elif browser == "safari":
                return random.choice(DESKTOP_SAFARI_UAS)
            else:  # edge
                return random.choice(DESKTOP_EDGE_UAS)

    def _get_referrer(
        self, source_preset: str, custom_ref: str = "", keywords: str = ""
    ) -> str:
        """Enhanced referrer selection with all traffic sources"""
        if custom_ref:
            return custom_ref

        if source_preset == "social":
            return random.choice(list(SOCIAL_REFERRERS.values()))
        elif source_preset == "organic" or source_preset == "organic_bing":
            # Prioritize project-specific keywords
            query_pool = SEARCH_QUERIES
            if keywords:
                # Support comma-separated or newline-separated keywords
                k_list = [k.strip() for k in re.split(r"[,|\n]", keywords) if k.strip()]
                if k_list:
                    query_pool = k_list

            query = random.choice(query_pool)
            base = "https://www.google.com/search?q="
            if source_preset == "organic_bing":
                base = "https://www.bing.com/search?q="
            return f"{base}{urllib.parse.quote(query)}"
        elif source_preset == "chatbot":
            return random.choice(list(CHATBOT_REFERRERS.values()))
        elif source_preset == "messenger":
            return random.choice(list(MESSENGER_REFERRERS.values()))
        elif source_preset == "news":
            return random.choice(list(NEWS_REFERRERS.values()))
        elif source_preset == "referral":
            # Generic referral
            referrers = ["https://example-blog.com/", "https://forum.example.com/"]
            return random.choice(referrers)

        return ""

    def _get_language_for_geo(self, country_code: Optional[str]) -> str:
        """Get appropriate language for geo-targeted country"""
        country_lang_map = {
            "US": "en-US,en;q=0.9",
            "GB": "en-GB,en;q=0.8",
            "DE": "de-DE,de;q=0.9",
            "FR": "fr-FR,fr;q=0.9",
            "IT": "it-IT,it;q=0.9",
            "ES": "es-ES,es;q=0.9",
            "BR": "pt-BR,pt;q=0.9",
            "NL": "nl-NL,nl;q=0.9",
            "JP": "ja-JP,ja;q=0.9",
            "KR": "ko-KR,ko;q=0.9",
            "CN": "zh-CN,zh;q=0.9",
            "RU": "ru-RU,ru;q=0.9",
            "VN": "vi-VN,vi;q=0.9",
        }
        return country_lang_map.get(country_code, random.choice(LANGUAGES))

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
        utm: Dict[str, str] = None,
        session_data: Dict[str, Any] = None,
    ):
        primary_event = "page_view"
        if events and "session_start" in events:
            primary_event = "session_start"

        headers = {
            "Accept": "*/*",
            "Accept-Language": fingerprint.get("ul")
            if fingerprint
            else "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": fingerprint.get("ua")
            if fingerprint
            else random.choice(ALL_UAS),
            "Referer": referrer if referrer else "",
        }

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
            "sr": fingerprint.get("sr", "1920x1080") if fingerprint else "1920x1080",
        }

        # Add UTM parameters with variable substitution
        if utm:
            for key, value in utm.items():
                # Variable substitution
                if value == "{{random_keyword}}":
                    value = random.choice(SEARCH_QUERIES)
                elif value == "{{timestamp}}":
                    value = str(int(time.time()))
                elif value == "{{device_type}}":
                    value = (
                        session_data.get("device_type", "desktop")
                        if session_data
                        else "desktop"
                    )

                param_key = {
                    "source": "cs",
                    "medium": "cm",
                    "campaign": "cn",
                    "term": "ck",
                    "content": "cc",
                }.get(key, key)
                params[param_key] = value

        if fingerprint:
            for k, v in fingerprint.items():
                if k not in ["ua", "ul", "sr"]:
                    params[k] = v

        base_url_ga = "https://www.google-analytics.com/g/collect"

        try:
            async with session.get(
                base_url_ga, params=params, headers=headers, timeout=5, proxy=proxy
            ) as response:
                status = "success" if response.status in [200, 204] else "failure"

                log_msg = f"GA Hit to {tid} for {url} | Status: {response.status}"
                self._add_log(log_msg, "success" if status == "success" else "error")

                if project_id:
                    await self._db_log_hit_async(
                        project_id,
                        url,
                        primary_event,
                        status,
                        proxy,
                        session_data=session_data,
                    )
                    if status == "success":
                        if project_id not in self.stats:
                            self.stats[project_id] = {
                                "success": 0,
                                "failure": 0,
                                "total": 0,
                            }
                        self.stats[project_id]["success"] += 1
                    else:
                        if project_id not in self.stats:
                            self.stats[project_id] = {
                                "success": 0,
                                "failure": 0,
                                "total": 0,
                            }
                        self.stats[project_id]["failure"] += 1
                    self.stats[project_id]["total"] += 1

                return status == "success"
        except Exception as e:
            logger.error(f"GA Hit error: {e}")
            if project_id:
                await self._db_log_hit_async(
                    project_id,
                    url,
                    primary_event,
                    "error",
                    proxy,
                    session_data=session_data,
                )
            return False

    async def _db_log_hit_async(
        self,
        project_id: str,
        url: str,
        event_type: str,
        status: str,
        proxy: str,
        session_data: Dict[str, Any] = None,
    ):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self._db_log_hit,
            project_id,
            url,
            event_type,
            status,
            proxy,
            session_data,
        )

    def _db_log_hit(
        self,
        project_id: str,
        url: str,
        event_type: str,
        status: str,
        proxy: str,
        session_data: Dict[str, Any] = None,
    ):
        try:
            db = database.SessionLocal()
            log = models.TrafficLog(
                project_id=project_id,
                url=url,
                event_type=event_type,
                status=status,
                proxy=proxy.split("@")[-1] if proxy else "Direct",
                device_type=session_data.get("device_type") if session_data else None,
                traffic_source=session_data.get("traffic_source")
                if session_data
                else None,
                bounced=session_data.get("bounced", False) if session_data else False,
                session_duration=session_data.get("session_duration")
                if session_data
                else None,
                pages_viewed=session_data.get("pages_viewed", 1) if session_data else 1,
            )
            db.add(log)

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
        targets_list = settings.get("targets", [])
        if not targets_list:
            t_url = settings.get("targetUrl", "https://example.com")
            t_tid = settings.get("ga4Tid", "G-XXXXXXXXXX")
            targets_list = [
                {"url": t_url, "tid": t_tid, "funnel": settings.get("funnel", [])}
            ]

        target = random.choice(targets_list)
        target_url = target.get("url")
        tid = target.get("tid")
        funnel = target.get("funnel", [])

        # Geo-Proxy logic with city/state support
        geo_targets = settings.get("geoTargets", [])
        proxy_url = None
        selected_country = None
        selected_state = None
        selected_city = None

        if proxies:
            if geo_targets:
                chosen_geo = random.choices(
                    geo_targets, weights=[g.get("percent", 1) for g in geo_targets]
                )[0]
                selected_country = chosen_geo.get("country")
                selected_state = chosen_geo.get("state")
                selected_city = chosen_geo.get("city")

                # Filter by country first
                valid_proxies = [
                    p for p in proxies if p.get("country") == selected_country
                ]

                # Further filter by state if specified
                if selected_state and valid_proxies:
                    state_proxies = [
                        p for p in valid_proxies if p.get("state") == selected_state
                    ]
                    if state_proxies:
                        valid_proxies = state_proxies

                # Further filter by city if specified
                if selected_city and valid_proxies:
                    city_proxies = [
                        p for p in valid_proxies if p.get("city") == selected_city
                    ]
                    if city_proxies:
                        valid_proxies = city_proxies

                if not valid_proxies:
                    valid_proxies = proxies
                proxy_url = random.choice(valid_proxies).get("url")
            else:
                proxy_url = random.choice(proxies).get("url")

        # Device Fingerprint with browser diversity
        dist = settings.get("device_distribution") or {
            "desktop": 50,
            "mobile": 50,
            "tablet": 0,
        }
        dev_type = random.choices(
            ["desktop", "mobile", "tablet"],
            weights=[
                dist.get("desktop", 50),
                dist.get("mobile", 50),
                dist.get("tablet", 0),
            ],
        )[0]

        # Get browser-specific UA
        browser_pref = settings.get(
            "browser_preference"
        )  # Optional: chrome, firefox, safari, edge
        ua = self._get_browser_ua(dev_type, browser_pref)

        if dev_type == "mobile":
            res = random.choice(SCREEN_RESOLUTIONS_MOBILE)
        elif dev_type == "tablet":
            res = random.choice(SCREEN_RESOLUTIONS_TABLET)
        else:
            res = random.choice(SCREEN_RESOLUTIONS_DESKTOP)

        # Language selection: Prefer user settings, then geo-target, then default
        config_langs = settings.get("languages", [])
        if config_langs:
            # Map simplified lang codes if needed
            ul = ",".join(config_langs)
        else:
            ul = self._get_language_for_geo(selected_country)

        fingerprint = {"ua": ua, "sr": res, "ul": ul}

        # Traffic Source & Referrer
        source_preset = settings.get("traffic_source_preset", "direct")
        custom_ref = settings.get("referrer", "")
        keywords = settings.get("keywords", "")
        referrer = self._get_referrer(source_preset, custom_ref, keywords)

        # UTM Tags with variable substitution
        utm_tags = settings.get("utm_tags", {})

        # Bridge: Check for individual fields from the UI if utm_tags is empty
        if not utm_tags:
            for k in ["utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent"]:
                val = settings.get(k)
                if val:
                    # Map 'utmSource' -> 'source', etc.
                    tag_key = k[3:].lower()
                    if tag_key == "source":
                        utm_tags["source"] = val
                    elif tag_key == "medium":
                        utm_tags["medium"] = val
                    elif tag_key == "campaign":
                        utm_tags["campaign"] = val
                    elif tag_key == "term":
                        utm_tags["term"] = val
                    elif tag_key == "content":
                        utm_tags["content"] = val

        # Bounce Rate Control
        bounce_rate_pct = settings.get("bounce_rate_pct", 0)
        will_bounce = random.randint(1, 100) <= bounce_rate_pct

        # Time on Site / Visit Duration parsing
        mu_duration = self.parse_duration(settings.get("timeOnPage", "30 seconds"))

        # CID (Returning vs New)
        returning_pct = settings.get("returning_visitor_pct", 0)
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

        # Session tracking data
        session_start_time = time.time()
        pages_viewed = 0
        session_data = {
            "device_type": dev_type,
            "traffic_source": source_preset,
            "bounced": False,
            "pages_viewed": 0,
            "session_duration": 0,
        }

        # Initial Hit (Landing Page)
        # Fetch actual page title from the URL
        landing_title = await fetch_page_title(target_url)
        if not landing_title:
            landing_title = "Home"

        success = await self.send_hit(
            session,
            tid,
            cid,
            sid,
            target_url,
            landing_title,
            sct,
            events=events,
            referrer=referrer,
            fingerprint=fingerprint,
            proxy=proxy_url,
            project_id=project.id,
            utm=utm_tags,
            session_data=session_data,
        )

        if success:
            pages_viewed = 1

        # If bounce rate triggered, stop here
        if will_bounce or not success:
            session_data["bounced"] = True
            session_data["pages_viewed"] = pages_viewed
            session_data["session_duration"] = random.uniform(
                2, 10
            )  # Short bounce duration
            await self._update_session_stats(project.id, cid, session_data)
            return

        # Internal Page Views (Funnel)
        # Priority: Custom Subpages (Sequential) -> Crawled URLs (Random) -> Legacy Funnel (Random)

        session_funnel = []
        target_depth = settings.get("pagesPerVisitor", 3)

        # 1. Custom Subpages (Sequential Priority)
        custom_subpages = settings.get("customSubpages", [])
        if custom_subpages:
            # Add them in order up to target_depth
            for i in range(min(len(custom_subpages), target_depth)):
                step_content = custom_subpages[i]
                if step_content and step_content.strip():
                    # Handle multiline: Split by newline/comma and pick random
                    candidates = [
                        u.strip() for u in re.split(r"[\n,]", step_content) if u.strip()
                    ]
                    if candidates:
                        chosen_url = random.choice(candidates)
                        session_funnel.append(
                            {"url": chosen_url, "title": f"Funnel Step {i + 1}"}
                        )

        # 2. Fill remaining slots with Crawled URLs or Legacy Funnel
        remaining_slots = target_depth - len(session_funnel)

        if remaining_slots > 0:
            random_pool = []

            # Add Crawled URLs
            crawled_urls = settings.get("crawledUrls", [])
            if crawled_urls:
                for url in crawled_urls:
                    if url:
                        random_pool.append({"url": url, "title": "Sitemap Page"})

            # Add Legacy Funnel
            for step in funnel:
                if step.get("url"):
                    random_pool.append(step)

            # Pick random pages to fill the rest
            if random_pool:
                # Allow repetition if pool is small? Let's try to be unique if possible
                unique_pool = [
                    p
                    for p in random_pool
                    if p["url"] not in [s["url"] for s in session_funnel]
                ]

                if not unique_pool and random_pool:
                    unique_pool = random_pool  # Fallback to duplicates if needed

                if unique_pool:
                    if len(unique_pool) >= remaining_slots:
                        session_funnel.extend(
                            random.sample(unique_pool, remaining_slots)
                        )
                    else:
                        session_funnel.extend(unique_pool)  # Take all available

        if session_funnel:
            for i, step in enumerate(session_funnel):
                wait_time = self.wait_natural(mu=mu_duration)
                await asyncio.sleep(wait_time)

                if not self.is_running:
                    break

                url = step.get("url")
                title = step.get("title") or "Page"

                step_success = await self.send_hit(
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
                    utm=utm_tags,
                    session_data=session_data,
                )

                if step_success:
                    pages_viewed += 1

                # Random early exit (natural behavior) - reduced chance if explicit funnel
                if random.random() < 0.05:  # 5% chance to exit early
                    break

        # Calculate final session duration
        session_duration = time.time() - session_start_time
        session_data["pages_viewed"] = pages_viewed
        session_data["session_duration"] = session_duration

        await self._update_session_stats(project.id, cid, session_data)

    async def _update_session_stats(
        self, project_id: str, cid: str, session_data: Dict
    ):
        """Update aggregated session statistics"""
        try:
            db = database.SessionLocal()

            # Update or create project stats for current hour
            now = datetime.datetime.utcnow()
            hour_start = now.replace(minute=0, second=0, microsecond=0)

            stats = (
                db.query(models.ProjectStats)
                .filter(
                    models.ProjectStats.project_id == project_id,
                    models.ProjectStats.hour == hour_start,
                )
                .first()
            )

            if not stats:
                stats = models.ProjectStats(
                    project_id=project_id,
                    hour=hour_start,
                    total_visitors=0,
                    successful_hits=0,
                    failed_hits=0,
                    bounce_count=0,
                    desktop_visitors=0,
                    mobile_visitors=0,
                    tablet_visitors=0,
                    organic_visitors=0,
                    social_visitors=0,
                    direct_visitors=0,
                    referral_visitors=0,
                    avg_session_duration=0.0,
                )
                db.add(stats)

            stats.total_visitors += 1

            if session_data.get("bounced"):
                stats.bounce_count += 1

            # Device breakdown
            device = session_data.get("device_type", "desktop")
            if device == "desktop":
                stats.desktop_visitors += 1
            elif device == "mobile":
                stats.mobile_visitors += 1
            else:
                stats.tablet_visitors += 1

            # Source breakdown
            source = session_data.get("traffic_source", "direct")
            if source in ["organic", "organic_bing"]:
                stats.organic_visitors += 1
            elif source in ["social"]:
                stats.social_visitors += 1
            elif source in ["direct"]:
                stats.direct_visitors += 1
            else:
                stats.referral_visitors += 1

            # Update average session duration
            current_avg = stats.avg_session_duration
            new_duration = session_data.get("session_duration", 0)
            stats.avg_session_duration = (
                current_avg * (stats.total_visitors - 1) + new_duration
            ) / stats.total_visitors

            db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Failed to update session stats: {e}")

    async def run_for_project(self, project_id: str, visitor_count: int = 1):
        """Runs visitors for a specific project"""
        db = database.SessionLocal()
        project = (
            db.query(models.Project).filter(models.Project.id == project_id).first()
        )
        if not project or project.status != "active":
            db.close()
            return

        # Fetch proxies
        proxies = db.query(models.Proxy).filter(models.Proxy.is_active == True).all()
        proxy_dicts = [
            {"url": p.url, "country": p.country, "state": p.state, "city": p.city}
            for p in proxies
        ]
        db.close()

        logger.info(
            f"Engine dispatching {visitor_count} visitors for Project {project.name}"
        )

        async with aiohttp.ClientSession() as session:
            tasks = []
            for _ in range(visitor_count):
                # Stagger with jitter
                await asyncio.sleep(random.uniform(0.1, 1.0))
                tasks.append(self.simulate_visitor(session, project, proxy_dicts))

            if tasks:
                await asyncio.gather(*tasks)

    def stop(self):
        self.is_running = False


ga_emu_engine = GAEmuEngine()
