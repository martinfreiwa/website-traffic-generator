import aiohttp
import asyncio
import logging
import os
import random
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "dev-internal-key-change-in-prod")

INITIAL_RETRY_DELAY = 0.5
MAX_RETRY_DELAY = 10.0
MAX_RETRIES = 3
CONNECTOR_LIMIT = 20
CONNECTOR_LIMIT_PER_HOST = 10


class APIClient:
    def __init__(self, api_url: str):
        self.api_url = api_url.rstrip("/")
        self._headers = {"X-Internal-API-Key": INTERNAL_API_KEY}

    async def _get_session(self) -> aiohttp.ClientSession:
        loop = asyncio.get_running_loop()
        if not hasattr(self, "_loop") or self._loop != loop:
            self._loop = loop
            self._connector = aiohttp.TCPConnector(
                limit=CONNECTOR_LIMIT,
                limit_per_host=CONNECTOR_LIMIT_PER_HOST,
                ttl_dns_cache=300,
                use_dns_cache=True,
            )
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            self._session = aiohttp.ClientSession(
                headers=self._headers,
                connector=self._connector,
                timeout=timeout,
            )
        elif self._session is None or self._session.closed:
            self._connector = aiohttp.TCPConnector(
                limit=CONNECTOR_LIMIT,
                limit_per_host=CONNECTOR_LIMIT_PER_HOST,
                ttl_dns_cache=300,
                use_dns_cache=True,
            )
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            self._session = aiohttp.ClientSession(
                headers=self._headers,
                connector=self._connector,
                timeout=timeout,
            )
        return self._session

    async def _request_with_retry(
        self, method: str, url: str, **kwargs
    ) -> Optional[aiohttp.ClientResponse]:
        retry_delay = INITIAL_RETRY_DELAY

        for attempt in range(MAX_RETRIES):
            try:
                session = await self._get_session()
                async with session.request(method, url, **kwargs) as resp:
                    if resp.status < 500:
                        return resp
                    else:
                        logger.warning(
                            f"Server error {resp.status} on attempt {attempt + 1}/{MAX_RETRIES}"
                        )
            except aiohttp.ClientConnectorError as e:
                logger.warning(
                    f"Connection error on attempt {attempt + 1}/{MAX_RETRIES}: {e}"
                )
            except asyncio.TimeoutError:
                logger.warning(f"Timeout on attempt {attempt + 1}/{MAX_RETRIES}")
            except aiohttp.ServerDisconnectedError:
                logger.warning(
                    f"Server disconnected on attempt {attempt + 1}/{MAX_RETRIES}"
                )
            except Exception as e:
                logger.warning(
                    f"Request error on attempt {attempt + 1}/{MAX_RETRIES}: {type(e).__name__}: {e}"
                )

            if attempt < MAX_RETRIES - 1:
                jitter = random.uniform(0, retry_delay * 0.1)
                await asyncio.sleep(retry_delay + jitter)
                retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)

        return None

    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        url = f"{self.api_url}/internal/project/{project_id}"
        logger.info(f"Fetching project from: {url}")

        resp = await self._request_with_retry("GET", url)
        if resp is None:
            logger.error(
                f"Failed to get project {project_id} after {MAX_RETRIES} retries"
            )
            return None

        try:
            if resp.status == 200:
                return await resp.json()
            else:
                response_text = await resp.text()
                logger.error(
                    f"Failed to get project: HTTP {resp.status}, response: {response_text[:200]}"
                )
                return None
        except Exception as e:
            logger.error(f"Error parsing project response: {e}")
            return None

    async def get_proxy_session(
        self,
        country_code: Optional[str] = None,
        country_name: Optional[str] = None,
        state: Optional[str] = None,
        city: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        payload = {
            "country_code": country_code,
            "country_name": country_name,
            "state": state,
            "city": city,
        }
        payload = {k: v for k, v in payload.items() if v is not None}

        url = f"{self.api_url}/internal/proxy-session"
        resp = await self._request_with_retry("POST", url, json=payload)

        if resp is None:
            logger.error("Failed to get proxy session after retries")
            return None

        try:
            if resp.status == 200:
                return await resp.json()
            else:
                logger.error(f"Failed to get proxy session: HTTP {resp.status}")
                return None
        except Exception as e:
            logger.error(f"Error parsing proxy session response: {e}")
            return None

    async def get_proxy_provider(self) -> Optional[Dict[str, Any]]:
        url = f"{self.api_url}/internal/proxy-provider"
        resp = await self._request_with_retry("GET", url)

        if resp is None:
            return None

        try:
            if resp.status == 200:
                return await resp.json()
            return None
        except Exception as e:
            logger.error(f"Error parsing proxy provider response: {e}")
            return None

    async def get_custom_proxies(self) -> list:
        url = f"{self.api_url}/internal/custom-proxies"
        resp = await self._request_with_retry("GET", url)

        if resp is None:
            return []

        try:
            if resp.status == 200:
                return await resp.json()
            return []
        except Exception as e:
            logger.error(f"Error parsing custom proxies response: {e}")
            return []

    async def log_traffic(
        self,
        project_id: str,
        url: str,
        event_type: str,
        status: str,
        proxy_session_id: Optional[str] = None,
    ) -> bool:
        payload = {
            "project_id": project_id,
            "url": url,
            "event_type": event_type,
            "status": status,
            "proxy_session_id": proxy_session_id,
        }

        api_url = f"{self.api_url}/internal/traffic-log"
        resp = await self._request_with_retry("POST", api_url, json=payload)

        if resp is None:
            logger.debug(f"Failed to log traffic after retries")
            return False

        if resp.status == 200:
            return True
        else:
            logger.debug(f"Failed to log traffic: HTTP {resp.status}")
            return False

    async def update_project_stats(
        self,
        project_id: str,
        hits_increment: int = 1,
    ) -> bool:
        url = f"{self.api_url}/internal/project-stats"
        resp = await self._request_with_retry(
            "POST",
            url,
            json={
                "project_id": project_id,
                "hits_increment": hits_increment,
            },
        )

        if resp is None:
            logger.debug(f"Failed to update stats after retries")
            return False

        if resp.status == 200:
            return True
        else:
            logger.debug(f"Failed to update stats: HTTP {resp.status}")
            return False

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None
        if self._connector:
            self._connector = None
# Cache bust: 1771717882
