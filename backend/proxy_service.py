import aiohttp
import asyncio
import random
import string
import logging
import datetime
import base64
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
import models
from database import SessionLocal

logger = logging.getLogger(__name__)

_proxy_cache: Dict[str, Tuple[Dict[str, Any], datetime.datetime]] = {}
CACHE_TTL_MINUTES = 5


class GeonodeProxyService:
    MONITOR_URL = "https://monitor.geonode.com"
    PROXY_HOST = "proxy.geonode.io"

    def __init__(self, provider: models.ProxyProvider):
        self.provider = provider

    def _get_auth_header(self) -> str:
        auth_string = f"{self.provider.username}:{self.provider.password}"
        encoded = base64.b64encode(auth_string.encode()).decode()
        return f"Basic {encoded}"

    def _get_auth(self) -> aiohttp.BasicAuth:
        return aiohttp.BasicAuth(self.provider.username, self.provider.password)

    async def test_connection(self) -> Dict[str, Any]:
        try:
            async with aiohttp.ClientSession() as session:
                proxy_url = f"http://{self.provider.username}:{self.provider.password}@{self.provider.proxy_host}:{self.provider.http_port_start}"
                test_url = "http://ip-api.com/json"
                async with session.get(
                    test_url, proxy=proxy_url, timeout=aiohttp.ClientTimeout(total=15)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {
                            "success": True,
                            "bandwidth_used_gb": 0,
                            "bandwidth_bytes": 0,
                            "message": f"Proxy connected! IP: {data.get('query', 'unknown')} ({data.get('country', 'unknown')})",
                        }
                    else:
                        response_text = await resp.text()
                        return {
                            "success": False,
                            "message": f"Proxy connection failed: HTTP {resp.status}",
                        }
        except Exception as e:
            return {"success": False, "message": f"Connection error: {str(e)}"}

    async def get_usage_stats(self) -> Dict[str, Any]:
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.MONITOR_URL}/monitor-light/proxies"
                headers = {"Authorization": self._get_auth_header()}
                async with session.get(
                    url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
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
                    response_text = await resp.text()
                    return {
                        "success": False,
                        "message": f"HTTP {resp.status}: {response_text[:200]}",
                    }
        except Exception as e:
            return {"success": False, "message": str(e)}

    async def fetch_available_locations(self) -> List[Dict[str, Any]]:
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.MONITOR_URL}/services/{self.provider.service_name}/targeting-options"
                async with session.get(
                    url, auth=self._get_auth(), timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        logger.info(f"Fetched {len(data)} geo locations from Geonode")
                        return data
                    response_text = await resp.text()
                    logger.error(
                        f"Failed to fetch locations: HTTP {resp.status} - {response_text[:500]}"
                    )
                    return []
        except Exception as e:
            logger.error(f"Error fetching locations: {e}")
            return []

    async def verify_proxy_location(self, proxy_url: str) -> Optional[Dict[str, Any]]:
        try:
            async with aiohttp.ClientSession() as session:
                test_url = "http://ip-api.com/json"
                async with session.get(
                    test_url, proxy=proxy_url, timeout=aiohttp.ClientTimeout(total=15)
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    logger.error(f"Proxy verification failed: HTTP {resp.status}")
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

        if port != 9000:
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

        try:
            db.add(session)
            db.commit()
            db.refresh(session)
            logger.info(
                f"Created proxy session {session_id} for {country_code}/{state}/{city}"
            )
            return session
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create proxy session: {e}")
            raise

    async def build_and_verify_proxy(
        self,
        country_code: str = None,
        state: str = None,
        city: str = None,
    ) -> Dict[str, Any]:
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

        return {
            "session_id": session_id,
            "proxy_url": proxy_url,
            "port": port,
            "country_code": actual_country,
            "city": actual_city,
            "ip_address": ip_address,
            "provider_id": self.provider.id,
        }

    def save_proxy_session(
        self,
        db: Session,
        proxy_data: Dict[str, Any],
        country_name: str = None,
        state: str = None,
    ) -> models.ProxySession:
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(
            minutes=self.provider.session_lifetime_minutes
        )

        session = models.ProxySession(
            provider_id=proxy_data["provider_id"],
            session_id=proxy_data["session_id"],
            proxy_url=proxy_data["proxy_url"],
            port=proxy_data["port"],
            country=country_name or proxy_data["country_code"],
            country_code=proxy_data["country_code"],
            state=state,
            city=proxy_data["city"],
            ip_address=proxy_data["ip_address"],
            is_active=True,
            expires_at=expires_at,
        )

        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    async def release_session(self, db: Session, session: models.ProxySession) -> bool:
        try:
            async with aiohttp.ClientSession() as session_http:
                url = f"{self.MONITOR_URL}/sticky-sessions/{self.provider.service_name}/release/{session.port}"
                async with session_http.put(
                    url, auth=self._get_auth(), timeout=aiohttp.ClientTimeout(total=10)
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


def get_cached_proxy(country_code: str) -> Optional[Dict[str, Any]]:
    cache_key = country_code or "default"
    if cache_key in _proxy_cache:
        proxy_data, expiry = _proxy_cache[cache_key]
        if datetime.datetime.utcnow() < expiry:
            logger.info(f"Reusing cached proxy session for {cache_key}")
            return proxy_data
        else:
            del _proxy_cache[cache_key]
    return None


def set_cached_proxy(country_code: str, proxy_data: Dict[str, Any]) -> None:
    cache_key = country_code or "default"
    expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=CACHE_TTL_MINUTES)
    _proxy_cache[cache_key] = (proxy_data, expiry)
    logger.info(f"Cached proxy session for {cache_key} until {expiry}")


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

    cached_proxy = get_cached_proxy(country_code)
    if cached_proxy:
        try:
            existing = (
                db.query(models.ProxySession)
                .filter(models.ProxySession.session_id == cached_proxy["session_id"])
                .first()
            )
            if existing:
                existing.last_used_at = datetime.datetime.utcnow()
                existing.request_count += 1
                db.commit()
                logger.info(f"Reusing existing DB session {cached_proxy['session_id']}")
                return existing
        except Exception as e:
            logger.warning(f"Failed to find cached proxy in DB: {e}")

    service = GeonodeProxyService(provider)

    last_error = None
    for attempt in range(max_retries):
        try:
            proxy_data = await service.build_and_verify_proxy(
                country_code=country_code,
                state=state,
                city=city,
            )

            if proxy_data and proxy_data.get("proxy_url"):
                if not proxy_data.get("ip_address"):
                    logger.warning(
                        f"Session created but no IP verified for {country_code}/{state}/{city} - Proceeding anyway"
                    )

                set_cached_proxy(country_code, proxy_data)

                session = service.save_proxy_session(
                    db=db,
                    proxy_data=proxy_data,
                    country_name=country_name,
                    state=state,
                )
                return session

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
                to=user.email,
                subject=f"[TrafficGen Pro] Project Paused - Proxy Unavailable",
                html=f"""
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
                to=provider.notification_email,
                subject=f"[TrafficGen Pro] Proxy Bandwidth Alert: {level}",
                html=f"""
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
