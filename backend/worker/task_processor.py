import asyncio
import logging
import os
import sys
import random
import time
import hashlib
import aiohttp
from typing import Dict, Any, Optional, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from worker.api_client import APIClient

logger = logging.getLogger(__name__)

DESKTOP_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
]

MOBILE_UAS = [
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
]

ALL_UAS = DESKTOP_UAS + MOBILE_UAS

SCREEN_RESOLUTIONS = [
    "1920x1080",
    "1536x864",
    "1366x768",
    "1440x900",
    "2560x1440",
    "390x844",
    "414x896",
    "360x800",
]

LANGUAGES = ["en-US,en;q=0.9", "en-GB,en;q=0.8", "de-DE,de;q=0.9", "fr-FR,fr;q=0.9"]

SEARCH_QUERIES = [
    "news",
    "latest updates",
    "how to",
    "best practices",
    "tutorial",
    "guide",
    "review",
    "tips",
]

SOCIAL_REFERRERS = {
    "Facebook": "https://l.facebook.com/",
    "Twitter": "https://t.co/",
    "Instagram": "https://www.instagram.com/",
    "LinkedIn": "https://www.linkedin.com/",
    "Reddit": "https://www.reddit.com/",
}

ORGANIC_REFERRERS = {
    "Google": "https://www.google.com/search?q=",
    "Bing": "https://www.bing.com/search?q=",
    "DuckDuckGo": "https://duckduckgo.com/?q=",
}


class TaskProcessor:
    def __init__(self):
        api_url = os.getenv("API_URL", "https://traffic-creator.com")
        self.api_client = APIClient(api_url)
        self.cid_pool: Dict[str, List[str]] = {}
        self.max_cid_pool = 100

    async def process(self, task_data: Dict[str, Any]) -> bool:
        try:
            task_id = task_data.get("task_id", "unknown")
            project_id = task_data.get("project_id")
            visitor_count = task_data.get("visitor_count", 1)

            if not project_id:
                logger.error(f"Task {task_id}: Missing project_id")
                return True

            logger.info(
                f"Processing task {task_id}: project={project_id}, visitors={visitor_count}"
            )

            project = await self.api_client.get_project(project_id)
            if not project:
                logger.error(f"Task {task_id}: Project not found")
                return True

            if project.get("status") != "active":
                logger.info(f"Task {task_id}: Project not active, skipping")
                return True

            hits_today = project.get("hits_today", 0)
            daily_limit = project.get("daily_limit", 0)
            if daily_limit > 0 and hits_today >= daily_limit:
                logger.info(
                    f"Task {task_id}: Daily limit reached ({hits_today}/{daily_limit})"
                )
                return True

            await self._run_traffic(project, visitor_count)

            logger.info(f"Task {task_id} completed successfully")
            return True

        except Exception as e:
            logger.error(f"Error processing task: {e}", exc_info=True)
            return False

    async def _run_traffic(self, project: Dict[str, Any], visitor_count: int):
        settings = project.get("settings", {}) or {}
        proxy_mode = settings.get("proxyMode", "auto")
        geo_targets = settings.get("geoTargets", [])
        url = project.get("url")
        project_id = project.get("id")

        if not url:
            logger.error(f"Project {project_id}: No URL configured")
            return

        use_geonode = proxy_mode in ["auto", "sticky"]
        custom_proxies = []

        if proxy_mode == "custom":
            custom_proxies = await self.api_client.get_custom_proxies()

        logger.info(
            f"Engine dispatching {visitor_count} visitors for {project.get('name')} (proxy_mode={proxy_mode})"
        )

        async with aiohttp.ClientSession() as session:
            proxy_failures = 0
            max_proxy_failures = 5
            successful_hits = 0

            for i in range(visitor_count):
                await asyncio.sleep(random.uniform(0.5, 2.0))

                proxy_url = None
                if use_geonode:
                    selected_geo = None
                    if geo_targets:
                        try:
                            weights = [g.get("percent", 1) for g in geo_targets]
                            selected_geo = random.choices(
                                geo_targets, weights=weights, k=1
                            )[0]
                        except Exception:
                            selected_geo = (
                                random.choice(geo_targets) if geo_targets else None
                            )

                    country_code = None
                    country_name = None
                    if selected_geo:
                        country_code = selected_geo.get(
                            "countryCode"
                        ) or selected_geo.get("country")
                        country_name = selected_geo.get("country")

                    proxy_session = await self.api_client.get_proxy_session(
                        country_code=country_code,
                        country_name=country_name,
                    )

                    if not proxy_session:
                        proxy_failures += 1
                        logger.warning(
                            f"Proxy session failed ({proxy_failures}/{max_proxy_failures})"
                        )
                        if proxy_failures >= max_proxy_failures:
                            logger.error("Too many proxy failures, stopping")
                            break
                        continue

                    proxy_url = proxy_session.get("proxy_url")
                elif custom_proxies:
                    proxy = random.choice(custom_proxies)
                    proxy_url = proxy.get("url")

                success = await self._send_visitor(
                    session=session,
                    project=project,
                    proxy_url=proxy_url,
                    settings=settings,
                )

                if success:
                    successful_hits += 1
                    await self.api_client.update_project_stats(project_id, 1)

            logger.info(f"Completed: {successful_hits}/{visitor_count} successful hits")

    async def _send_visitor(
        self,
        session: aiohttp.ClientSession,
        project: Dict[str, Any],
        proxy_url: Optional[str],
        settings: Dict[str, Any],
    ) -> bool:
        project_id = project.get("id")
        url = project.get("url")
        tid = settings.get("tid") or settings.get("ga4Tid")

        if not tid:
            logger.warning(f"Project {project_id}: No GA4 TID configured")
            return False

        device_type = self._select_device_type(settings)
        ua = self._select_user_agent(device_type)
        language = random.choice(LANGUAGES)
        screen_res = self._select_screen_resolution(device_type)

        cid = self._get_or_create_cid(project_id, settings)
        sid = self._generate_sid()
        sct = 2 if cid in self.cid_pool.get(project_id, []) else 1

        custom_subpages = settings.get("customSubpages", []) or []
        crawled_urls = settings.get("crawledUrls", []) or []
        all_pages = list(
            set(
                [p for p in custom_subpages if p]
                + [p for p in crawled_urls if p]
                + ["/"]
            )
        )

        bounce_rate = settings.get("bounce_rate_pct", 0) or settings.get(
            "bounceRatePct", 0
        )
        will_bounce = random.randint(1, 100) <= bounce_rate

        referrer = self._get_referrer(settings)
        utm = self._get_utm_tags(settings)

        fingerprint = {"ua": ua, "ul": language, "sr": screen_res}

        landing_page = random.choice(all_pages) if all_pages else "/"
        target_url = (
            f"{url.rstrip('/')}{landing_page}"
            if landing_page.startswith("/")
            else landing_page
        )

        success = await self._send_ga_hit(
            session=session,
            tid=tid,
            cid=cid,
            sid=sid,
            url=target_url,
            title="",
            sct=sct,
            referrer=referrer,
            fingerprint=fingerprint,
            proxy=proxy_url,
            project_id=project_id,
            utm=utm,
        )

        if not success or will_bounce:
            return success

        pages_per_visitor = settings.get("pagesPerVisitor", 1) or settings.get(
            "pages_per_visitor", 1
        )
        time_on_page = self._parse_duration(settings.get("timeOnPage", "30 seconds"))

        num_additional_pages = min(pages_per_visitor - 1, len(all_pages) - 1)
        if num_additional_pages > 0 and len(all_pages) > 1:
            remaining_pages = [p for p in all_pages if p != landing_page]
            additional_pages = random.sample(
                remaining_pages, min(num_additional_pages, len(remaining_pages))
            )

            for page in additional_pages:
                await asyncio.sleep(
                    random.uniform(time_on_page * 0.5, time_on_page * 1.5)
                )

                page_url = f"{url.rstrip('/')}{page}" if page.startswith("/") else page
                await self._send_ga_hit(
                    session=session,
                    tid=tid,
                    cid=cid,
                    sid=sid,
                    url=page_url,
                    title="",
                    sct=sct,
                    referrer="",
                    fingerprint=fingerprint,
                    proxy=proxy_url,
                    project_id=project_id,
                    utm=utm,
                )

        return True

    async def _send_ga_hit(
        self,
        session: aiohttp.ClientSession,
        tid: str,
        cid: str,
        sid: str,
        url: str,
        title: str,
        sct: int,
        referrer: str,
        fingerprint: Dict[str, Any],
        proxy: Optional[str],
        project_id: str,
        utm: Dict[str, str],
    ) -> bool:
        headers = {
            "Accept": "*/*",
            "Accept-Language": fingerprint.get("ul", "en-US,en;q=0.9"),
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": fingerprint.get("ua", random.choice(ALL_UAS)),
            "Referer": referrer,
        }

        params = {
            "v": "2",
            "tid": tid,
            "cid": cid,
            "sid": sid,
            "sct": str(sct),
            "seg": "1",
            "dl": url,
            "dt": title,
            "en": "page_view",
            "_p": str(int(time.time() * 1000)),
            "sr": fingerprint.get("sr", "1920x1080"),
        }

        if utm:
            for key, value in utm.items():
                if value == "{{random_keyword}}":
                    value = random.choice(SEARCH_QUERIES)
                elif value == "{{timestamp}}":
                    value = str(int(time.time()))
                param_key = {
                    "source": "cs",
                    "medium": "cm",
                    "campaign": "cn",
                    "term": "ck",
                    "content": "cc",
                }.get(key, key)
                params[param_key] = value

        proxy_kwargs = {"proxy": proxy} if proxy else {}

        try:
            async with session.get(
                "https://www.google-analytics.com/g/collect",
                params=params,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=15),
                **proxy_kwargs,
            ) as response:
                status = "success" if response.status in [200, 204, 302] else "failed"
                await self.api_client.log_traffic(
                    project_id=project_id,
                    url=url,
                    event_type="page_view",
                    status=status,
                )
                return status == "success"
        except Exception as e:
            logger.error(f"GA hit error: {e}")
            await self.api_client.log_traffic(
                project_id=project_id,
                url=url,
                event_type="page_view",
                status="error",
            )
            return False

    def _select_device_type(self, settings: Dict[str, Any]) -> str:
        device_dist = settings.get("deviceDistribution", {}) or settings.get(
            "device_distribution", {}
        )
        if not device_dist:
            return "desktop"

        total = sum(device_dist.values())
        if total == 0:
            return "desktop"

        r = random.uniform(0, total)
        cumulative = 0
        for device, weight in device_dist.items():
            cumulative += weight
            if r <= cumulative:
                return device
        return "desktop"

    def _select_user_agent(self, device_type: str) -> str:
        if device_type == "mobile":
            return random.choice(MOBILE_UAS)
        return random.choice(DESKTOP_UAS)

    def _select_screen_resolution(self, device_type: str) -> str:
        if device_type == "mobile":
            return random.choice(["390x844", "414x896", "360x800", "375x667"])
        return random.choice(
            ["1920x1080", "1536x864", "1366x768", "1440x900", "2560x1440"]
        )

    def _get_or_create_cid(self, project_id: str, settings: Dict[str, Any]) -> str:
        returning_pct = settings.get("returning_visitor_pct", 0) or settings.get(
            "returningVisitorPct", 0
        )

        if project_id not in self.cid_pool:
            self.cid_pool[project_id] = []

        is_returning = (
            random.randint(1, 100) <= returning_pct and self.cid_pool[project_id]
        )

        if is_returning:
            return random.choice(self.cid_pool[project_id])

        cid = hashlib.md5(
            f"{project_id}{time.time()}{random.random()}".encode()
        ).hexdigest()[:16]

        if len(self.cid_pool[project_id]) < self.max_cid_pool:
            self.cid_pool[project_id].append(cid)

        return cid

    def _generate_sid(self) -> str:
        return str(int(time.time()))

    def _get_referrer(self, settings: Dict[str, Any]) -> str:
        source_preset = settings.get("traffic_source_preset", "direct") or settings.get(
            "trafficSourcePreset", "direct"
        )
        custom_ref = settings.get("referrer", "") or settings.get("customReferrer", "")
        keywords = settings.get("keywords", "") or settings.get("customKeywords", "")

        if custom_ref:
            return custom_ref

        if source_preset == "organic":
            search_engine = random.choice(list(ORGANIC_REFERRERS.keys()))
            query = keywords or random.choice(SEARCH_QUERIES)
            return f"{ORGANIC_REFERRERS[search_engine]}{query}"
        elif source_preset == "social":
            social = random.choice(list(SOCIAL_REFERRERS.keys()))
            return SOCIAL_REFERRERS[social]
        elif source_preset == "referral":
            return (
                settings.get("referralUrl", "https://example.com/")
                or "https://example.com/"
            )

        return ""

    def _get_utm_tags(self, settings: Dict[str, Any]) -> Dict[str, str]:
        utm_tags = settings.get("utm_tags", {}) or settings.get("utmTags", {})
        if utm_tags:
            return utm_tags

        utm = {}
        for key in ["utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent"]:
            val = settings.get(key)
            if val:
                tag_key = key[3:].lower()
                utm[tag_key] = val
        return utm

    def _parse_duration(self, duration_str: str) -> float:
        if not duration_str:
            return 30.0

        try:
            duration_str = duration_str.lower().strip()
            if "min" in duration_str:
                num = int("".join(filter(str.isdigit, duration_str)) or "1")
                return num * 60.0
            elif "sec" in duration_str:
                num = int("".join(filter(str.isdigit, duration_str)) or "30")
                return float(num)
            else:
                num = int("".join(filter(str.isdigit, duration_str)) or "30")
                return float(num)
        except Exception:
            return 30.0

    async def close(self):
        await self.api_client.close()
