import aiohttp
import asyncio
import random
import string
import logging
import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import models
from database import SessionLocal

logger = logging.getLogger(__name__)


class GeonodeProxyService:
    MONITOR_URL = "https://monitor.geonode.com"
    PROXY_HOST = "proxy.geonode.io"

    def __init__(self, provider: models.ProxyProvider):
        self.provider = provider

    def _get_auth(self) -> aiohttp.BasicAuth:
        return aiohttp.BasicAuth(self.provider.username, self.provider.password)

    async def test_connection(self) -> Dict[str, Any]:
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.MONITOR_URL}/monitor-light/proxies"
                async with session.get(url, auth=self._get_auth(), timeout=10) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        bandwidth_data = (
                            data.get("data", {}).get("bandwidth", {}).get("data", {})
                        )
                        return {
                            "success": True,
                            "bandwidth_used_gb": bandwidth_data.get(
                                "totalBandwidthInGB", 0
                            ),
                            "bandwidth_bytes": bandwidth_data.get("default", 0),
                            "message": "Connection successful",
                        }
                    else:
                        return {
                            "success": False,
                            "message": f"Authentication failed: HTTP {resp.status}",
                        }
        except Exception as e:
            return {"success": False, "message": f"Connection error: {str(e)}"}

    async def get_usage_stats(self) -> Dict[str, Any]:
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.MONITOR_URL}/monitor-light/proxies"
                async with session.get(url, auth=self._get_auth(), timeout=10) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        bandwidth_data = (
                            data.get("data", {}).get("bandwidth", {}).get("data", {})
                        )
                        used_gb = bandwidth_data.get("totalBandwidthInGB", 0)
                        limit_gb = self.provider.bandwidth_limit_gb
                        percent = (used_gb / limit_gb * 100) if limit_gb else 0
                        return {
                            "success": True,
                            "bandwidth_used_gb": used_gb,
                            "bandwidth_limit_gb": limit_gb,
                            "percent": percent,
                            "bandwidth_bytes": bandwidth_data.get("default", 0),
                        }
                    return {"success": False, "message": f"HTTP {resp.status}"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    async def fetch_available_locations(self) -> List[Dict[str, Any]]:
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.MONITOR_URL}/services/{self.provider.service_name}/targeting-options"
                async with session.get(url, auth=self._get_auth(), timeout=30) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data
                    logger.error(f"Failed to fetch locations: HTTP {resp.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching locations: {e}")
            return []

    async def verify_proxy_location(self, proxy_url: str) -> Optional[Dict[str, Any]]:
        try:
            async with aiohttp.ClientSession() as session:
                test_url = "http://ip-api.com/json"
                async with session.get(test_url, proxy=proxy_url, timeout=15) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Proxy verification failed: {e}")
            return None

    def _generate_session_id(self, length: int = 12) -> str:
        chars = string.ascii_lowercase + string.digits
        return "sess_" + "".join(random.choices(chars, k=length))

    def get_random_port(self) -> int:
        return random.randint(
            self.provider.http_port_start, self.provider.http_port_end
        )

    def build_proxy_url(
        self,
        country_code: str,
        session_id: str,
        port: int,
        state: str = None,
        city: str = None,
    ) -> str:
        username_parts = [self.provider.username]

        if country_code:
            username_parts.append(f"country-{country_code}")

        if state:
            state_clean = state.lower().replace(" ", "")
            username_parts.append(f"state-{state_clean}")

        if city:
            city_clean = city.lower().replace(" ", "")
            username_parts.append(f"city-{city_clean}")

        username_parts.append(f"session-{session_id}")

        username = "-".join(username_parts)
        password = self.provider.password

        proxy_url = f"http://{username}:{password}@{self.provider.proxy_host}:{port}"
        return proxy_url

    async def create_session(
        self,
        db: Session,
        country_code: str = None,
        country_name: str = None,
        state: str = None,
        city: str = None,
    ) -> models.ProxySession:
        session_id = self._generate_session_id()
        port = self.get_random_port()

        proxy_url = self.build_proxy_url(
            country_code=country_code or "",
            session_id=session_id,
            port=port,
            state=state,
            city=city,
        )

        ip_info = await self.verify_proxy_location(proxy_url)
        ip_address = ip_info.get("query") if ip_info else None
        actual_country = ip_info.get("countryCode") if ip_info else country_code
        actual_city = ip_info.get("city") if ip_info else city

        expires_at = datetime.datetime.utcnow() + datetime.timedelta(
            minutes=self.provider.session_lifetime_minutes
        )

        session = models.ProxySession(
            provider_id=self.provider.id,
            session_id=session_id,
            proxy_url=proxy_url,
            port=port,
            country=country_name or actual_country,
            country_code=actual_country,
            state=state,
            city=actual_city,
            ip_address=ip_address,
            is_active=True,
            expires_at=expires_at,
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        logger.info(
            f"Created proxy session {session_id} for {country_code}/{state}/{city}"
        )
        return session

    async def release_session(self, db: Session, session: models.ProxySession) -> bool:
        try:
            async with aiohttp.ClientSession() as session_http:
                url = f"{self.MONITOR_URL}/sticky-sessions/{self.provider.service_name}/release/{session.port}"
                async with session_http.put(
                    url, auth=self._get_auth(), timeout=10
                ) as resp:
                    if resp.status in [200, 204]:
                        session.is_active = False
                        db.commit()
                        logger.info(f"Released session {session.session_id}")
                        return True
        except Exception as e:
            logger.error(f"Failed to release session: {e}")

        session.is_active = False
        db.commit()
        return True

    async def release_all_sessions(self, db: Session) -> int:
        active_sessions = (
            db.query(models.ProxySession)
            .filter(
                models.ProxySession.provider_id == self.provider.id,
                models.ProxySession.is_active == True,
            )
            .all()
        )

        count = 0
        for session in active_sessions:
            await self.release_session(db, session)
            count += 1

        return count


async def get_active_provider(db: Session) -> Optional[models.ProxyProvider]:
    return (
        db.query(models.ProxyProvider)
        .filter(models.ProxyProvider.is_active == True)
        .first()
    )


async def get_or_create_session(
    db: Session,
    country_code: str = None,
    country_name: str = None,
    state: str = None,
    city: str = None,
    cid: str = None,
    max_retries: int = 3,
) -> Optional[models.ProxySession]:
    provider = await get_active_provider(db)
    if not provider:
        return None

    if cid:
        existing_session = (
            db.query(models.ProxySession)
            .filter(
                models.ProxySession.provider_id == provider.id,
                models.ProxySession.is_active == True,
                models.ProxySession.expires_at > datetime.datetime.utcnow(),
            )
            .order_by(models.ProxySession.created_at.desc())
            .first()
        )

        if existing_session:
            existing_session.last_used_at = datetime.datetime.utcnow()
            existing_session.request_count += 1
            db.commit()
            return existing_session

    service = GeonodeProxyService(provider)

    last_error = None
    for attempt in range(max_retries):
        try:
            session = await service.create_session(
                db=db,
                country_code=country_code,
                country_name=country_name,
                state=state,
                city=city,
            )

            if session and session.ip_address:
                return session

            if session:
                logger.warning(
                    f"Session created but no IP verified for {country_code}/{state}/{city}"
                )

        except Exception as e:
            last_error = e
            logger.warning(
                f"Proxy session attempt {attempt + 1}/{max_retries} failed: {e}"
            )

        if attempt < max_retries - 1:
            delay = (2**attempt) + random.uniform(0.5, 1.5)
            logger.info(f"Retrying proxy session creation in {delay:.1f}s...")
            await asyncio.sleep(delay)

    logger.error(
        f"All {max_retries} proxy session attempts failed. Last error: {last_error}"
    )
    return None


async def handle_proxy_unavailable(
    db: Session,
    project: models.Project,
    requested_geo: Dict[str, Any],
    error_message: str,
):
    from email_service import send_email

    project.status = "stopped"
    project.force_stop_reason = (
        f"Proxy unavailable for geo-target: {requested_geo.get('country', 'Unknown')}"
    )
    db.commit()

    user = db.query(models.User).filter(models.User.id == project.user_id).first()
    if user:
        try:
            await send_email(
                to_email=user.email,
                subject=f"[TrafficGen Pro] Project Paused - Proxy Unavailable",
                content=f"""
Your project "{project.name}" has been paused due to proxy unavailability.

Requested Geo-Target:
- Country: {requested_geo.get("country", "Unknown")}
- State: {requested_geo.get("state", "N/A")}
- City: {requested_geo.get("city", "N/A")}

Error: {error_message}

Please check your proxy configuration in the admin panel or contact support.

---
TrafficGen Pro
                """.strip(),
            )
        except Exception as e:
            logger.error(f"Failed to send proxy unavailable email: {e}")

    notification = models.Notification(
        user_id=project.user_id,
        title=f"Project Paused: Proxy Unavailable",
        message=f"Project '{project.name}' paused - no proxy available for {requested_geo.get('country', 'Unknown')}",
    )
    db.add(notification)
    db.commit()

    logger.info(
        f"Project {project.id} paused due to proxy unavailability for {requested_geo}"
    )


async def sync_geo_locations(db: Session, provider: models.ProxyProvider) -> int:
    service = GeonodeProxyService(provider)
    locations = await service.fetch_available_locations()

    if not locations:
        logger.warning("No locations returned from Geonode")
        return 0

    db.query(models.GeoLocationCache).filter(
        models.GeoLocationCache.provider_id == provider.id
    ).delete()

    count = 0
    for loc in locations:
        cache_entry = models.GeoLocationCache(
            provider_id=provider.id,
            country_code=loc.get("code", ""),
            country_name=loc.get("name", ""),
            states=loc.get("states", {}).get("options", []),
            cities=loc.get("cities", {}).get("options", []),
            asns=loc.get("asns", {}).get("options", []),
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        )
        db.add(cache_entry)
        count += 1

    provider.last_sync_at = datetime.datetime.utcnow()
    db.commit()

    logger.info(f"Synced {count} geo locations for provider {provider.id}")
    return count


async def check_bandwidth_and_notify(db: Session, provider: models.ProxyProvider):
    from email_service import send_email

    service = GeonodeProxyService(provider)
    stats = await service.get_usage_stats()

    if not stats.get("success"):
        return

    used_gb = stats.get("bandwidth_used_gb", 0)
    limit_gb = provider.bandwidth_limit_gb

    if not limit_gb:
        provider.bandwidth_used_gb = used_gb
        db.commit()
        return

    percent = (used_gb / limit_gb) * 100
    provider.bandwidth_used_gb = used_gb

    notifications = []

    if percent >= 100 and not provider.warned_at_100:
        notifications.append(("100%", "CRITICAL: Proxy bandwidth exhausted!"))
        provider.warned_at_100 = True
    elif percent >= 80 and not provider.warned_at_80 and provider.warn_at_80:
        notifications.append(("80%", "WARNING: Proxy bandwidth at 80%"))
        provider.warned_at_80 = True
    elif percent >= 50 and not provider.warned_at_50 and provider.warn_at_50:
        notifications.append(("50%", "Notice: Proxy bandwidth at 50%"))
        provider.warned_at_50 = True
    elif percent >= 20 and not provider.warned_at_20 and provider.warn_at_20:
        notifications.append(("20%", "Info: Proxy bandwidth at 20% remaining"))
        provider.warned_at_20 = True

    for level, message in notifications:
        logger.warning(f"Proxy bandwidth alert: {level} - {message}")

        try:
            await send_email(
                to_email=provider.notification_email,
                subject=f"[TrafficGen Pro] Proxy Bandwidth Alert: {level}",
                content=f"""
Proxy bandwidth alert for {provider.name}:

{message}

Bandwidth Used: {used_gb:.2f} GB / {limit_gb:.2f} GB ({percent:.1f}%)

Login to your dashboard to take action.

---
TrafficGen Pro
                """.strip(),
            )
        except Exception as e:
            logger.error(f"Failed to send bandwidth notification: {e}")

        notification = models.Notification(
            user_id="admin",
            title=f"Proxy Bandwidth Alert: {level}",
            message=f"{message} ({used_gb:.2f} GB / {limit_gb:.2f} GB)",
        )
        db.add(notification)

    db.commit()


async def cleanup_expired_sessions(db: Session):
    expired = (
        db.query(models.ProxySession)
        .filter(
            models.ProxySession.is_active == True,
            models.ProxySession.expires_at < datetime.datetime.utcnow(),
        )
        .all()
    )

    for session in expired:
        session.is_active = False

    if expired:
        db.commit()
        logger.info(f"Cleaned up {len(expired)} expired proxy sessions")


proxy_service = None


def init_proxy_service():
    global proxy_service
    db = SessionLocal()
    try:
        provider = (
            db.query(models.ProxyProvider)
            .filter(models.ProxyProvider.is_active == True)
            .first()
        )
        if provider:
            proxy_service = GeonodeProxyService(provider)
    finally:
        db.close()


def log_proxy_request(
    db: Session,
    provider_id: str,
    session_id: str = None,
    project_id: str = None,
    request_url: str = None,
    response_code: int = None,
    latency_ms: int = None,
    error_message: str = None,
    country_code: str = None,
    state: str = None,
    city: str = None,
    ip_address: str = None,
    success: bool = True,
):
    try:
        log_entry = models.ProxyLog(
            provider_id=provider_id,
            session_id=session_id,
            project_id=project_id,
            request_url=request_url,
            response_code=response_code,
            latency_ms=latency_ms,
            error_message=error_message,
            country_code=country_code,
            state=state,
            city=city,
            ip_address=ip_address,
            success=success,
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log proxy request: {e}")
        db.rollback()
