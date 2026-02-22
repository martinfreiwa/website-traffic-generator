from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import models
from dependencies import verify_internal_api_key
from error_logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


class InternalProjectConfig(BaseModel):
    id: str
    name: str
    status: str
    url: str
    daily_limit: int
    total_target: int
    total_hits: int
    hits_today: int
    settings: Dict[str, Any]
    plan_type: str


class InternalTrafficLog(BaseModel):
    project_id: str
    url: str
    event_type: str
    status: str
    proxy_session_id: Optional[str] = None


class InternalProjectStats(BaseModel):
    project_id: str
    hits_increment: int = 1


class InternalProxySessionRequest(BaseModel):
    country_code: Optional[str] = None
    country_name: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None


class InternalProxySessionResponse(BaseModel):
    session_id: str
    proxy_url: str
    country: Optional[str]
    country_code: Optional[str]
    state: Optional[str]
    city: Optional[str]
    ip_address: Optional[str]
    is_active: bool


@router.get("/internal/project/{project_id}", response_model=InternalProjectConfig)
def internal_get_project(
    project_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    verify_internal_api_key(request)
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    settings = project.settings or {}
    url = (
        settings.get("url")
        or settings.get("entryUrls")
        or settings.get("targetUrl")
        or ""
    )
    if isinstance(url, str) and "\n" in url:
        url = url.split("\n")[0].strip()
    return InternalProjectConfig(
        id=project.id,
        name=project.name,
        status=project.status,
        url=url,
        daily_limit=project.daily_limit,
        total_target=project.total_target,
        total_hits=project.total_hits,
        hits_today=project.hits_today,
        settings=settings,
        plan_type=project.plan_type,
    )
    logger.info(f"DEBUG entryUrls value: {settings.get('entryUrls')}")
    url = (
        settings.get("url")
        or settings.get("entryUrls")
        or settings.get("targetUrl")
        or ""
    )
    logger.info(f"DEBUG final url: {url}")
    if isinstance(url, str) and "\n" in url:
        url = url.split("\n")[0].strip()
    return InternalProjectConfig(
        id=project.id,
        name=project.name,
        status=project.status,
        url=url,
        daily_limit=project.daily_limit,
        total_target=project.total_target,
        total_hits=project.total_hits,
        hits_today=project.hits_today,
        settings=settings,
        plan_type=project.plan_type,
    )


@router.post("/internal/traffic-log")
def internal_traffic_log(
    data: InternalTrafficLog,
    request: Request,
    db: Session = Depends(get_db),
):
    verify_internal_api_key(request)
    try:
        log_entry = models.TrafficLog(
            project_id=data.project_id,
            url=data.url,
            event_type=data.event_type,
            status=data.status,
        )
        db.add(log_entry)
        db.commit()
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Failed to log traffic: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/internal/project-stats")
def internal_update_project_stats(
    data: InternalProjectStats,
    request: Request,
    db: Session = Depends(get_db),
):
    verify_internal_api_key(request)
    project = (
        db.query(models.Project).filter(models.Project.id == data.project_id).first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.total_hits = (project.total_hits or 0) + data.hits_increment
    project.hits_today = (project.hits_today or 0) + data.hits_increment

    user = db.query(models.User).filter(models.User.id == project.user_id).first()
    if user and project.plan_type:
        if project.plan_type == "economy":
            user.balance_economy = max(
                0, (user.balance_economy or 0) - data.hits_increment
            )
        elif project.plan_type == "professional":
            user.balance_professional = max(
                0, (user.balance_professional or 0) - data.hits_increment
            )
        elif project.plan_type == "expert":
            user.balance_expert = max(
                0, (user.balance_expert or 0) - data.hits_increment
            )

    db.commit()
    return {"status": "ok", "total_hits": project.total_hits}


@router.post("/internal/proxy-session", response_model=InternalProxySessionResponse)
async def internal_get_proxy_session(
    data: InternalProxySessionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    verify_internal_api_key(request)
    from proxy_service import get_or_create_session

    proxy_session = await get_or_create_session(
        db=db,
        country_code=data.country_code,
        country_name=data.country_name,
        state=data.state,
        city=data.city,
    )

    if not proxy_session:
        raise HTTPException(status_code=503, detail="No proxy session available")

    return InternalProxySessionResponse(
        session_id=proxy_session.session_id,
        proxy_url=proxy_session.proxy_url,
        country=proxy_session.country,
        country_code=proxy_session.country_code,
        state=proxy_session.state,
        city=proxy_session.city,
        ip_address=proxy_session.ip_address,
        is_active=proxy_session.is_active,
    )


@router.get("/internal/proxy-provider")
async def internal_get_proxy_provider(
    request: Request,
    db: Session = Depends(get_db),
):
    verify_internal_api_key(request)
    from proxy_service import get_active_provider

    provider = await get_active_provider(db)
    if not provider:
        return {"active": False}
    return {
        "active": provider.is_active,
        "name": provider.name,
        "api_key": provider.api_key[:8] + "..." if provider.api_key else None,
    }


@router.get("/internal/custom-proxies")
def internal_get_custom_proxies(
    request: Request,
    db: Session = Depends(get_db),
):
    verify_internal_api_key(request)
    proxies = db.query(models.Proxy).filter(models.Proxy.is_active == True).all()
    return [
        {
            "url": p.url,
            "country": p.country,
            "state": p.state,
            "city": p.city,
        }
        for p in proxies
    ]


@router.get("/internal/user/{email}")
def internal_get_user(
    email: str,
    request: Request,
    db: Session = Depends(get_db),
):
    verify_internal_api_key(request)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return {"exists": False, "email": email}
    return {
        "exists": True,
        "email": user.email,
        "id": user.id,
        "role": user.role,
        "is_verified": user.is_verified,
        "created_at": str(user.created_at) if user.created_at else None,
        "password_hash_exists": bool(user.password_hash),
    }


@router.post("/internal/user/{email}/verify")
def internal_verify_user(
    email: str,
    request: Request,
    db: Session = Depends(get_db),
):
    verify_internal_api_key(request)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return {"success": False, "error": "User not found"}
    user.is_verified = True
    db.commit()
    return {"success": True, "email": user.email, "is_verified": True}
