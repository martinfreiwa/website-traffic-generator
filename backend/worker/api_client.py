import aiohttp
import logging
import os
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "dev-internal-key-change-in-prod")


class APIClient:
    def __init__(self, api_url: str):
        self.api_url = api_url.rstrip("/")
        self._headers = {"X-Internal-API-Key": INTERNAL_API_KEY}

    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        try:
            async with aiohttp.ClientSession(headers=self._headers) as session:
                async with session.get(
                    f"{self.api_url}/internal/project/{project_id}",
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        logger.error(f"Failed to get project: HTTP {resp.status}")
                        return None
        except Exception as e:
            logger.error(f"Error getting project: {e}")
            return None

    async def get_proxy_session(
        self,
        country_code: Optional[str] = None,
        country_name: Optional[str] = None,
        state: Optional[str] = None,
        city: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        try:
            payload = {
                "country_code": country_code,
                "country_name": country_name,
                "state": state,
                "city": city,
            }
            payload = {k: v for k, v in payload.items() if v is not None}

            async with aiohttp.ClientSession(headers=self._headers) as session:
                async with session.post(
                    f"{self.api_url}/internal/proxy-session",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        logger.error(f"Failed to get proxy session: HTTP {resp.status}")
                        return None
        except Exception as e:
            logger.error(f"Error getting proxy session: {e}")
            return None

    async def get_proxy_provider(self) -> Optional[Dict[str, Any]]:
        try:
            async with aiohttp.ClientSession(headers=self._headers) as session:
                async with session.get(
                    f"{self.api_url}/internal/proxy-provider",
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Error getting proxy provider: {e}")
            return None

    async def get_custom_proxies(self) -> list:
        try:
            async with aiohttp.ClientSession(headers=self._headers) as session:
                async with session.get(
                    f"{self.api_url}/internal/custom-proxies",
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return []
        except Exception as e:
            logger.error(f"Error getting custom proxies: {e}")
            return []

    async def log_traffic(
        self,
        project_id: str,
        url: str,
        event_type: str,
        status: str,
        proxy_session_id: Optional[str] = None,
    ) -> bool:
        try:
            payload = {
                "project_id": project_id,
                "url": url,
                "event_type": event_type,
                "status": status,
                "proxy_session_id": proxy_session_id,
            }

            async with aiohttp.ClientSession(headers=self._headers) as session:
                async with session.post(
                    f"{self.api_url}/internal/traffic-log",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        return True
                    else:
                        logger.error(f"Failed to log traffic: HTTP {resp.status}")
                        return False
        except Exception as e:
            logger.error(f"Error logging traffic: {e}")
            return False

    async def update_project_stats(
        self,
        project_id: str,
        hits_increment: int = 1,
    ) -> bool:
        try:
            async with aiohttp.ClientSession(headers=self._headers) as session:
                async with session.post(
                    f"{self.api_url}/internal/project-stats",
                    json={
                        "project_id": project_id,
                        "hits_increment": hits_increment,
                    },
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        return True
                    else:
                        logger.error(f"Failed to update stats: HTTP {resp.status}")
                        return False
        except Exception as e:
            logger.error(f"Error updating stats: {e}")
            return False
