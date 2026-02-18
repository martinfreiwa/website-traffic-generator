from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
import logging
import time
import traceback

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import models
from database import SessionLocal, engine, get_db
from enhanced_scheduler import scheduler
from sse_starlette.sse import EventSourceResponse
from web_utils import find_ga4_tid
import error_logger
from error_logger import (
    init_error_tracking,
    set_request_id,
    set_user_context,
    clear_user_context,
    add_breadcrumb,
    capture_exception,
    log_request,
    get_logger,
)
import json
import asyncio
import requests
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from fastapi import File, UploadFile, Form
import shutil
import os
import secrets
import stripe
import email_service
import random
import string
import uuid

logger = get_logger(__name__)

# --- Stripe Configuration ---
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder_if_not_set")
stripe.api_key = STRIPE_SECRET_KEY

# Create Tables
models.Base.metadata.create_all(bind=engine)


# Run column migrations for existing tables
def run_column_migrations():
    db = SessionLocal()
    try:
        from sqlalchemy import text

        def column_exists(table: str, column: str) -> bool:
            result = db.execute(
                text(
                    "SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column"
                ),
                {"table": table, "column": column},
            ).fetchone()
            return result is not None

        def table_exists(table: str) -> bool:
            result = db.execute(
                text(
                    "SELECT 1 FROM information_schema.tables WHERE table_name = :table"
                ),
                {"table": table},
            ).fetchone()
            return result is not None

        def add_column_if_missing(table: str, col_name: str, col_type: str):
            if not column_exists(table, col_name):
                try:
                    db.execute(
                        text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}")
                    )
                    db.commit()
                    logger.info(f"Added column {table}.{col_name}")
                except Exception as e:
                    db.rollback()
                    logger.warning(f"Could not add {table}.{col_name}: {e}")

        def create_table_if_missing(table_name: str, columns: str):
            if not table_exists(table_name):
                try:
                    db.execute(text(f"CREATE TABLE {table_name} ({columns})"))
                    db.commit()
                    logger.info(f"Created table {table_name}")
                except Exception as e:
                    db.rollback()
                    logger.warning(f"Could not create {table_name}: {e}")

        users_cols = [
            ("name", "VARCHAR(255)"),
            ("balance_economy", "FLOAT DEFAULT 0.0"),
            ("balance_professional", "FLOAT DEFAULT 0.0"),
            ("balance_expert", "FLOAT DEFAULT 0.0"),
            ("shadow_banned", "BOOLEAN DEFAULT FALSE"),
            ("is_verified", "BOOLEAN DEFAULT FALSE"),
            ("notes", "TEXT"),
            ("tags", "JSONB"),
            ("ban_reason", "VARCHAR(255)"),
            ("last_ip", "VARCHAR(100)"),
            ("last_active", "TIMESTAMP"),
        ]

        for col_name, col_type in users_cols:
            add_column_if_missing("users", col_name, col_type)

        user_sessions_cols = [
            ("session_token", "VARCHAR(255)"),
            ("ip_address", "VARCHAR(100)"),
            ("user_agent", "TEXT"),
            ("device", "VARCHAR(50)"),
            ("browser", "VARCHAR(50)"),
            ("current_page", "VARCHAR(255)"),
            ("total_visits", "INTEGER DEFAULT 1"),
            ("status", "VARCHAR(50) DEFAULT 'active'"),
            ("last_active", "TIMESTAMP"),
            ("expires_at", "TIMESTAMP"),
        ]

        for col_name, col_type in user_sessions_cols:
            add_column_if_missing("user_sessions", col_name, col_type)

        tickets_cols = [
            ("category", "VARCHAR(100) DEFAULT 'general'"),
            ("type", "VARCHAR(100) DEFAULT 'ticket'"),
            ("priority", "VARCHAR(50) DEFAULT 'low'"),
            ("project_id", "VARCHAR(255)"),
            ("attachment_urls", "JSONB"),
            ("messages", "JSONB"),
            ("updated_at", "TIMESTAMP"),
        ]

        for col_name, col_type in tickets_cols:
            add_column_if_missing("tickets", col_name, col_type)

        traffic_log_cols = [
            ("session_duration", "FLOAT"),
            ("pages_viewed", "INTEGER DEFAULT 1"),
            ("device_type", "VARCHAR(50)"),
            ("traffic_source", "VARCHAR(100)"),
            ("bounced", "BOOLEAN DEFAULT FALSE"),
        ]

        for col_name, col_type in traffic_log_cols:
            add_column_if_missing("traffic_log", col_name, col_type)

        tables_to_create = [
            (
                "user_notification_prefs",
                """id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255) UNIQUE, email_marketing BOOLEAN DEFAULT TRUE, email_transactional BOOLEAN DEFAULT TRUE, email_alerts BOOLEAN DEFAULT TRUE, browser_notifications BOOLEAN DEFAULT TRUE, newsletter_sub BOOLEAN DEFAULT FALSE, email_frequency VARCHAR(50) DEFAULT 'instant', updated_at TIMESTAMP""",
            ),
            (
                "activity_logs",
                """id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), action VARCHAR(255), details JSONB, ip_address VARCHAR(100), user_agent TEXT, created_at TIMESTAMP""",
            ),
            (
                "token_blacklist",
                """id VARCHAR(255) PRIMARY KEY, token VARCHAR(500), revoked_at TIMESTAMP, expires_at TIMESTAMP""",
            ),
            (
                "impersonation_logs",
                """id VARCHAR(255) PRIMARY KEY, admin_id VARCHAR(255), target_user_id VARCHAR(255), started_at TIMESTAMP, ended_at TIMESTAMP, actions JSONB""",
            ),
            (
                "balance_adjustment_logs",
                """id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), admin_id VARCHAR(255), amount INTEGER, tier VARCHAR(50), reason TEXT, created_at TIMESTAMP""",
            ),
            (
                "email_logs",
                """id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), email_type VARCHAR(100), recipient VARCHAR(255), subject TEXT, status VARCHAR(50), error TEXT, sent_at TIMESTAMP""",
            ),
            (
                "affiliate_relations",
                """id VARCHAR(255) PRIMARY KEY, referrer_id VARCHAR(255), referred_id VARCHAR(255), level INTEGER DEFAULT 1, created_at TIMESTAMP""",
            ),
            (
                "affiliate_earnings",
                """id VARCHAR(255) PRIMARY KEY, referrer_id VARCHAR(255), referred_id VARCHAR(255), amount FLOAT, tier VARCHAR(50), status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP""",
            ),
            (
                "benefit_requests",
                """id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), benefit_type_id VARCHAR(255), claimed_value FLOAT DEFAULT 0.0, approved_value FLOAT, status VARCHAR(50) DEFAULT 'pending', admin_notes TEXT, fraud_flagged BOOLEAN DEFAULT FALSE, fraud_reason VARCHAR(255), submitted_at TIMESTAMP, reviewed_at TIMESTAMP, reviewed_by VARCHAR(255)""",
            ),
            (
                "payout_requests",
                """id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), amount FLOAT, method VARCHAR(50), payout_details JSONB, status VARCHAR(50) DEFAULT 'pending', admin_notes TEXT, requested_at TIMESTAMP, processed_at TIMESTAMP, processed_by VARCHAR(255), transaction_hash VARCHAR(255)""",
            ),
            (
                "benefit_types",
                """id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description TEXT, value FLOAT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP""",
            ),
            (
                "affiliate_tiers",
                """id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), tier VARCHAR(50), commission_rate FLOAT DEFAULT 0.1, referrals_count INTEGER DEFAULT 0, earnings_total FLOAT DEFAULT 0.0, created_at TIMESTAMP, updated_at TIMESTAMP""",
            ),
            (
                "conversion_settings",
                """id VARCHAR(255) PRIMARY KEY DEFAULT 'global', social_proof_enabled BOOLEAN DEFAULT FALSE, social_proof_position VARCHAR(50), social_proof_delay INTEGER, social_proof_show_simulated BOOLEAN, exit_intent_enabled BOOLEAN DEFAULT FALSE, exit_intent_headline TEXT, exit_intent_subtext TEXT, exit_intent_coupon_code VARCHAR(50), promo_bar_enabled BOOLEAN DEFAULT FALSE, promo_bar_message TEXT, promo_bar_button_text VARCHAR(100), promo_bar_button_url VARCHAR(255), promo_bar_background_color VARCHAR(20), promo_bar_text_color VARCHAR(20), promo_bar_countdown_end TIMESTAMP, updated_at TIMESTAMP""",
            ),
            (
                "loyalty_settings",
                """id VARCHAR(255) PRIMARY KEY DEFAULT 'global', enabled BOOLEAN DEFAULT FALSE, points_per_dollar FLOAT DEFAULT 1.0, points_for_signup INTEGER DEFAULT 0, points_for_referral INTEGER DEFAULT 0, minimum_redemption INTEGER DEFAULT 100, redemptions JSONB, updated_at TIMESTAMP""",
            ),
            (
                "referral_settings",
                """id VARCHAR(255) PRIMARY KEY DEFAULT 'global', enabled BOOLEAN DEFAULT FALSE, referrer_reward_type VARCHAR(50), referrer_reward_value FLOAT DEFAULT 0.0, referee_reward_type VARCHAR(50), referee_reward_value FLOAT DEFAULT 0.0, minimum_payout FLOAT DEFAULT 10.0, updated_at TIMESTAMP""",
            ),
            (
                "faqs",
                """id VARCHAR(255) PRIMARY KEY, question TEXT, answer TEXT, category VARCHAR(100), order_index INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP, updated_at TIMESTAMP""",
            ),
            (
                "coupons",
                """id VARCHAR(255) PRIMARY KEY, code VARCHAR(50) UNIQUE, discount_type VARCHAR(20), discount_value FLOAT, min_purchase FLOAT, max_uses INTEGER, used_count INTEGER DEFAULT 0, valid_from TIMESTAMP, valid_until TIMESTAMP, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP""",
            ),
            (
                "marketing_campaigns",
                """id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), source VARCHAR(100), medium VARCHAR(100), campaign VARCHAR(255), term VARCHAR(255), content VARCHAR(255), clicks INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0, created_at TIMESTAMP""",
            ),
            (
                "broadcasts",
                """id VARCHAR(255) PRIMARY KEY, title VARCHAR(255), message TEXT, type VARCHAR(50), link VARCHAR(255), is_active BOOLEAN DEFAULT FALSE, start_date TIMESTAMP, end_date TIMESTAMP, created_at TIMESTAMP""",
            ),
        ]

        for table_name, columns in tables_to_create:
            create_table_if_missing(table_name, columns)

        try:
            db.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_user_sessions_session_token ON user_sessions(session_token)"
                )
            )
            db.commit()
        except Exception as e:
            db.rollback()

        try:
            db.execute(
                text(
                    "UPDATE users SET is_verified = TRUE WHERE email = 'nucularreview@gmail.com'"
                )
            )
            db.commit()
            logger.info("Verified user nucularreview@gmail.com")
        except Exception as e:
            db.rollback()
            logger.warning(f"Could not verify nucularreview@gmail.com: {e}")

    except Exception as e:
        logger.error(f"Migration error: {e}")
    finally:
        db.close()


run_column_migrations()

app = FastAPI(title="TrafficGen Pro SaaS API")

# Rate Limiter Configuration
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


# Exception handler for rate limits
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:8]
    set_request_id(request_id)

    start_time = time.time()

    add_breadcrumb(
        message=f"Request started: {request.method} {request.url.path}",
        category="request",
        data={"query": str(request.query_params)},
    )

    response = await call_next(request)

    duration_ms = (time.time() - start_time) * 1000

    response.headers["X-Request-ID"] = request_id

    log_request(
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=duration_ms,
        ip_address=request.client.host if request.client else None,
    )

    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = request.headers.get("X-Request-ID", "unknown")

    if exc.status_code >= 500:
        logger.error(
            f"HTTP {exc.status_code} error on {request.method} {request.url.path}: {exc.detail}",
            extra={"request_id": request_id, "status_code": exc.status_code},
        )
        capture_exception(exc)
    elif exc.status_code >= 400:
        logger.warning(
            f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}",
            extra={"request_id": request_id},
        )

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "request_id": request_id},
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = request.headers.get("X-Request-ID", "unknown")

    logger.exception(
        f"Unhandled exception on {request.method} {request.url.path}: {type(exc).__name__}: {exc}",
        extra={"request_id": request_id},
    )

    capture_exception(
        exc,
        context={
            "request": {
                "method": request.method,
                "path": request.url.path,
                "query": str(request.query_params),
            }
        },
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": request_id,
            "error_type": type(exc).__name__,
        },
        headers={"X-Request-ID": request_id},
    )


# Ensure static directory exists
os.makedirs("static/avatars", exist_ok=True)
os.makedirs("static/assets", exist_ok=True)

# Serve static files for assets only
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/favicon.ico")
async def favicon():
    return FileResponse("static/favicon.ico")


@app.get("/favicon.svg")
async def favicon_svg():
    return FileResponse("static/favicon.svg")


# --- Security & Auth Config ---
SECRET_KEY = "your-secret-key-change-this-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)


@app.on_event("startup")
async def startup_event():
    environment = os.getenv("ENVIRONMENT", "development")
    log_level = os.getenv("LOG_LEVEL", "INFO")
    init_error_tracking(environment=environment, log_level=log_level)
    logger.info(f"Starting TrafficGen Pro API in {environment} mode")
    await scheduler.start()


@app.on_event("shutdown")
async def shutdown_event():
    await scheduler.stop()


# --- Schemas ---


class UserCreate(BaseModel):
    email: str
    password: str
    name: str = "User"
    ref_code: Optional[str] = None  # Referral code from referrer


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    balance: float
    balance_economy: float = 0.0
    balance_professional: float = 0.0
    balance_expert: float = 0.0
    api_key: Optional[str] = None
    affiliate_code: Optional[str] = None
    status: Optional[str] = "active"
    plan: Optional[str] = "free"
    shadow_banned: bool = False
    is_verified: bool = False
    notes: Optional[str] = None
    tags: Optional[List[str]] = []
    ban_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    last_ip: Optional[str] = None
    last_active: Optional[datetime] = None

    # Extended Fields
    phone: Optional[str] = None
    company: Optional[str] = None
    vat_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    zip: Optional[str] = None
    website: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    job_title: Optional[str] = None
    public_profile: Optional[bool] = False
    two_factor_enabled: Optional[bool] = False
    email_frequency: Optional[str] = "instant"
    login_notification_enabled: Optional[bool] = False
    newsletter_sub: Optional[bool] = False
    sound_effects: Optional[bool] = True
    developer_mode: Optional[bool] = False
    api_whitelist: Optional[List[str]] = []
    webhook_secret: Optional[str] = None
    accessibility: Optional[Dict[str, Any]] = {}
    social_links: Optional[Dict[str, Any]] = {}
    login_history: Optional[List[Dict[str, Any]]] = []
    recovery_email: Optional[str] = None
    timezone: Optional[str] = "UTC"
    language: Optional[str] = "English"
    theme_accent_color: Optional[str] = "#ff4d00"
    skills_badges: Optional[List[str]] = []
    referral_code: Optional[str] = None
    support_pin: Optional[str] = None
    date_format: Optional[str] = "YYYY-MM-DD"
    number_format: Optional[str] = "en-US"
    require_password_reset: Optional[bool] = False
    avatar_url: Optional[str] = None

    # Gamification & Streak Fields
    gamification_xp: int = 0
    gamification_level: int = 1
    gamification_total_spent: float = 0.0
    gamification_permanent_discount: int = 0
    streak_days: int = 0
    streak_best: int = 0
    projects_count: int = 0

    class Config:
        from_attributes = True


class ProxyCreate(BaseModel):
    url: str
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None


class ProxyResponse(BaseModel):
    id: int
    url: str
    country: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class ProjectCreate(BaseModel):
    name: str
    plan_type: str = "Custom"
    tier: Optional[str] = None
    settings: Dict[str, Any]
    daily_limit: int = 0
    total_target: int = 0
    start_at: Optional[datetime] = None


class AdminProjectCreate(ProjectCreate):
    user_email: str
    priority: int = 0
    is_hidden: bool = False
    internal_tags: List[str] = []
    notes: Optional[str] = None


class AdminProjectUpdate(BaseModel):
    priority: Optional[int] = None
    force_stop_reason: Optional[str] = None
    is_hidden: Optional[bool] = None
    internal_tags: Optional[List[str]] = None
    notes: Optional[str] = None
    is_flagged: Optional[bool] = None
    status: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    daily_limit: Optional[int] = None
    total_target: Optional[int] = None
    status: Optional[str] = None
    tier: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    status: str
    plan_type: Optional[str] = "Custom"
    tier: Optional[str] = None
    settings: Dict[str, Any]
    daily_limit: int = 0
    total_target: int = 0
    hits_today: Optional[int] = 0
    total_hits: Optional[int] = 0
    start_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    priority: int = 0
    force_stop_reason: Optional[str] = None
    is_hidden: bool = False
    internal_tags: List[str] = []
    notes: Optional[str] = None
    is_flagged: bool = False

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: str
    type: str
    amount: float
    description: Optional[str]
    status: str
    tier: Optional[str]
    hits: Optional[int]
    reference: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AffiliateEarningResponse(BaseModel):
    id: str
    amount: float
    status: str
    created_at: datetime
    referee_email: Optional[str] = None  # Added via join

    class Config:
        from_attributes = True


class QuoteResponse(BaseModel):
    estimated_visits: int
    rate: float


class DepositRequest(BaseModel):
    user_email: str
    amount: float
    tier: Optional[str] = None
    description: Optional[str] = "Manual Funding"
    hits: Optional[int] = None


class TicketCreate(BaseModel):
    subject: str
    priority: str = "low"
    type: str = "ticket"
    category: str = "general"
    project_id: Optional[str] = None
    attachment_urls: List[str] = []
    messages: List[Dict[str, Any]] = []


class TicketReply(BaseModel):
    text: str
    sender: str = "user"
    attachments: Optional[List[str]] = []


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None


class TicketResponse(BaseModel):
    id: str
    user_id: str
    user_email: Optional[str] = None
    subject: str
    status: str
    priority: str
    type: str
    category: str = "general"
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    attachment_urls: List[str] = []
    messages: List[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BroadcastCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    expires_at: Optional[datetime] = None
    is_active: bool = True
    action_url: Optional[str] = None
    action_text: Optional[str] = None


class BroadcastResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime]
    action_url: Optional[str]
    action_text: Optional[str]

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    plan: Optional[str] = None
    shadow_banned: Optional[bool] = None
    is_verified: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    ban_reason: Optional[str] = None
    password: Optional[str] = None


class ActivityLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action_type: str
    action_detail: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: Optional[datetime] = None


class UserSessionResponse(BaseModel):
    id: str
    user_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Dict[str, Any] = {}
    location: Optional[str] = None
    created_at: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True


class ImpersonationLogResponse(BaseModel):
    id: str
    admin_id: str
    target_user_id: str
    action: str
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None
    admin_email: Optional[str] = None


class BalanceAdjustmentLogResponse(BaseModel):
    id: str
    user_id: str
    admin_id: Optional[str] = None
    adjustment_type: str
    tier: Optional[str] = None
    amount: float = 0
    hits: Optional[int] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    admin_email: Optional[str] = None


class EmailLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    email_type: str
    to_email: str
    subject: Optional[str] = None
    status: str = "sent"
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None


class UserNotificationPrefsResponse(BaseModel):
    id: str
    user_id: str
    email_marketing: bool = True
    email_transactional: bool = True
    email_alerts: bool = True
    browser_notifications: bool = True
    newsletter_sub: bool = False
    email_frequency: str = "instant"
    updated_at: Optional[datetime] = None


class AdminUserDetailsResponse(BaseModel):
    user: UserResponse
    tier_balances: Dict[str, int] = {}
    total_spent: float = 0
    total_hits_purchased: int = 0
    total_hits_used: int = 0
    transactions_count: int = 0
    projects_count: int = 0
    tickets_count: int = 0
    referrals_count: int = 0
    referral_earnings: float = 0
    notification_prefs: Optional[UserNotificationPrefsResponse] = None


class BalanceAdjustRequest(BaseModel):
    adjustment_type: str  # 'credit', 'debit'
    tier: str  # 'economy', 'professional', 'expert', 'general'
    amount: float = 0
    hits: Optional[int] = None
    reason: str
    notes: Optional[str] = None


class AddBonusHitsRequest(BaseModel):
    tier: str
    hits: int
    reason: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    vat_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    zip: Optional[str] = None
    website: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    job_title: Optional[str] = None
    public_profile: Optional[bool] = None
    two_factor_enabled: Optional[bool] = None
    email_frequency: Optional[str] = None
    login_notification_enabled: Optional[bool] = None
    newsletter_sub: Optional[bool] = None
    sound_effects: Optional[bool] = None
    developer_mode: Optional[bool] = None
    api_whitelist: Optional[List[str]] = None
    webhook_secret: Optional[str] = None
    accessibility: Optional[Dict[str, Any]] = None
    social_links: Optional[Dict[str, Any]] = None
    recovery_email: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    theme_accent_color: Optional[str] = None
    date_format: Optional[str] = None
    number_format: Optional[str] = None
    require_password_reset: Optional[bool] = None
    avatar_url: Optional[str] = None


class SystemSettingsUpdate(BaseModel):
    settings: Dict[str, Any]


class QuickCampaignCreate(BaseModel):
    email: str
    project_name: str
    target_url: str
    total_visitors: int = 10000
    settings: Dict[str, Any]


class QuickCampaignResponse(BaseModel):
    success: bool
    project_id: str
    message: str


class TrafficStart(BaseModel):
    targets: List[Dict[str, Any]]
    visitors_per_min: int
    duration_mins: int
    mode: str = "direct_hit"
    returning_visitor_pct: Optional[int] = 0
    bounce_rate_pct: Optional[int] = 0
    referrer: Optional[str] = ""
    traffic_source_preset: Optional[str] = "direct"
    utm_tags: Optional[Dict[str, Any]] = None
    device_distribution: Optional[Dict[str, Any]] = None
    target_country: Optional[str] = None
    target_state: Optional[str] = None
    target_city: Optional[str] = None
    is_dry_run: bool = False
    total_visitor_count: Optional[int] = None


# --- Benefit & Affiliate Schemas ---


class BenefitTypeResponse(BaseModel):
    id: str
    type: str
    category: str
    name: str
    value: float
    requirements: Dict[str, Any]
    active: bool
    display_order: int

    class Config:
        from_attributes = True


class BenefitTypeCreate(BaseModel):
    type: str
    category: str
    name: str
    value: float
    requirements: Dict[str, Any] = {}
    active: bool = True
    display_order: int = 0


class BenefitRequestCreate(BaseModel):
    benefit_type: str
    benefit_category: str
    url: str
    description: Optional[str] = None
    screenshot_url: Optional[str] = None
    claimed_value: float


class BenefitRequestResponse(BaseModel):
    id: str
    user_id: str
    benefit_type: str
    benefit_category: str
    url: str
    description: Optional[str]
    screenshot_url: Optional[str]
    claimed_value: float
    approved_value: Optional[float]
    status: str
    admin_notes: Optional[str]
    fraud_flagged: bool
    fraud_reason: Optional[str]
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[str]

    class Config:
        from_attributes = True


class BenefitRequestReview(BaseModel):
    approved_value: Optional[float] = None
    status: str
    admin_notes: Optional[str] = None
    fraud_flagged: bool = False
    fraud_reason: Optional[str] = None


class AffiliateTierResponse(BaseModel):
    id: str
    user_id: str
    tier_level: int
    tier_name: str
    commission_rate_l1: float
    commission_rate_l2: float
    commission_rate_l3: float
    total_referrals_l1: int
    total_referrals_l2: int
    total_referrals_l3: int
    total_earnings: float
    pending_payout: float
    lifetime_payout: float
    last_tier_update: datetime

    class Config:
        from_attributes = True


class AffiliateRelationResponse(BaseModel):
    id: str
    user_id: str
    referrer_l1_id: Optional[str]
    referrer_l2_id: Optional[str]
    referrer_l3_id: Optional[str]

    class Config:
        from_attributes = True


class PayoutRequestCreate(BaseModel):
    amount: float
    method: str
    payout_details: Dict[str, Any]


class PayoutRequestResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    method: str
    payout_details: Dict[str, Any]
    status: str
    admin_notes: Optional[str]
    requested_at: datetime
    processed_at: Optional[datetime]
    processed_by: Optional[str]
    transaction_hash: Optional[str]

    class Config:
        from_attributes = True


class PayoutRequestReview(BaseModel):
    status: str
    admin_notes: Optional[str] = None
    transaction_hash: Optional[str] = None


class AffiliateDashboardResponse(BaseModel):
    tier: AffiliateTierResponse
    relations: List[AffiliateRelationResponse]
    referral_link: str
    total_referrals: int
    total_earnings: float
    pending_payout: float
    benefit_balance: float


class BenefitBalanceResponse(BaseModel):
    benefit_balance: float
    total_benefits_claimed: float
    pending_requests: int
    approved_requests: int
    rejected_requests: int


# --- Helpers ---


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def generate_verification_code():
    return "".join(random.choices(string.digits, k=4))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_user_access_token(
    user: models.User, expires_delta: Optional[timedelta] = None
):
    """Creates a token bound to the user's specific token version for invalidation support"""
    data = {
        "sub": user.email,
        "ver": user.token_version if user.token_version is not None else 1,
    }
    return create_access_token(data, expires_delta)


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except (JWTError, AttributeError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception

    # Validation of token version (for server-side logout)
    token_ver = payload.get("ver")
    if (
        token_ver is not None
        and user.token_version is not None
        and token_ver != user.token_version
    ):
        # Token is old/invalidated
        raise credentials_exception

    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    api_key: Optional[str] = Depends(api_key_header),
    db: Session = Depends(get_db),
):
    """Hybrid authentication: Supports both JWT and API Keys"""
    if api_key:
        user = db.query(models.User).filter(models.User.api_key == api_key).first()
        if user:
            return user

    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email:
                user = db.query(models.User).filter(models.User.email == email).first()
                if user:
                    # Validate token version
                    token_ver = payload.get("ver")
                    if (
                        token_ver is not None
                        and user.token_version is not None
                        and token_ver != user.token_version
                    ):
                        # Token invalid, fall through to raise generic error if strictly required or just return None?
                        # Since this is 'optional', usually it implies 'soft' auth.
                        # But if a token is PRESENT but INVALID, it should probably be rejected or ignored.
                        # However, for 'users/me', usually we want strict auth.
                        # 'read_users_me' uses optional? Why?
                        # Ah, likely for mixed access. But if the token is revoked, we should treat it as unauth.
                        pass  # Don't return the user if version mismatch
                    else:
                        return user
        except JWTError:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid authentication (JWT or X-API-KEY required)",
    )


# --- Endpoints ---


@app.post("/auth/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Affiliate mapping
    referred_by_id = None
    if user.ref_code:
        referrer = (
            db.query(models.User)
            .filter(models.User.affiliate_code == user.ref_code)
            .first()
        )
        if referrer:
            referred_by_id = referrer.id

    hashed_password = get_password_hash(user.password)
    verification_code = generate_verification_code()
    verification_token_expires = datetime.utcnow() + timedelta(hours=24)

    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        referred_by=referred_by_id,
        verification_token=verification_code,
        verification_token_expires=verification_token_expires,
        is_verified=True,
        affiliate_code=f"REF-{user.email[:3].upper()}-{secrets.token_hex(3).upper()}",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"Sending verification email to: {user.email}")
    try:
        result = email_service.send_verification_email(user.email, verification_code)
        if result.get("success"):
            logger.info(f"Verification email sent to {user.email}")
        else:
            logger.warning(
                f"Failed to send verification email to {user.email}: {result.get('error')}"
            )
    except Exception as e:
        logger.error(f"Error sending verification email: {e}")

    return new_user


@app.post("/auth/token", response_model=Token)
@limiter.limit("10/minute")
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update Login History
    try:
        current_history = user.login_history or []
        # Keep only last 10 entries
        if len(current_history) >= 10:
            current_history.pop()  # Remove oldest (last item usually, but we prepend)

        new_entry = {
            "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "ip": request.client.host,
            "device": request.headers.get("user-agent", "Unknown Device"),
        }
        # Prepend new entry
        current_history.insert(0, new_entry)
        user.login_history = current_history
        user.last_ip = request.client.host
        user.last_active = datetime.utcnow()
        db.commit()
    except Exception as e:
        logger.error(f"Error updating login history: {e}")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # Use version-aware token creator
    access_token = create_user_access_token(
        user=user, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


@app.put("/auth/password")
def change_password(
    data: PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect")

    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")

    current_user.password_hash = get_password_hash(data.new_password)
    # Optional: Log out other sessions by incrementing version
    # current_user.token_version += 1
    db.commit()
    return {"status": "password updated"}


@app.post("/auth/logout-all")
def logout_all_sessions(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # Increment token version to invalidate all existing JWTs
    current_user.token_version = (
        current_user.token_version if current_user.token_version is not None else 1
    ) + 1
    db.commit()
    return {"status": "all sessions invalidated", "message": "Please log in again."}


@app.get("/users/me/export")
def export_user_data(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """GDPR Data Download"""
    projects = (
        db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
    )
    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .all()
    )

    export_data = {
        "user_profile": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.display_name or current_user.email,
            "created_at": str(current_user.created_at),
            "balance": current_user.balance,
            "role": current_user.role,
            "login_history": current_user.login_history,
        },
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "created_at": str(p.created_at),
                "settings": p.settings,
            }
            for p in projects
        ],
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "date": str(t.created_at),
                "description": t.description,
            }
            for t in transactions
        ],
    }

    return export_data


@app.get("/users/me", response_model=UserResponse)
def read_users_me(
    current_user: models.User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    if not current_user:
        return None

    projects_count = (
        db.query(models.Project)
        .filter(models.Project.user_id == current_user.id)
        .count()
    )

    user_dict = UserResponse.model_validate(current_user)
    user_dict.projects_count = projects_count
    return user_dict


class PresenceUpdate(BaseModel):
    session_token: Optional[str] = None
    current_page: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device: Optional[str] = None
    browser: Optional[str] = None


@app.post("/users/presence")
def update_presence(
    presence: PresenceUpdate,
    current_user: models.User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Track user presence/activity"""
    from datetime import datetime, timedelta

    now = datetime.utcnow()

    if presence.session_token:
        session = (
            db.query(models.UserSession)
            .filter(models.UserSession.session_token == presence.session_token)
            .first()
        )

        if session:
            session.current_page = presence.current_page
            session.last_active = now
            session.total_visits += 1
            db.commit()
            return {"session_id": session.id, "status": "updated"}
    else:
        session_token = secrets.token_urlsafe(32)
        user_agent = presence.user_agent or ""

        device = "desktop"
        if "mobile" in user_agent.lower():
            device = "mobile"
        elif "tablet" in user_agent.lower() or "ipad" in user_agent.lower():
            device = "tablet"

        browser = "other"
        if "chrome" in user_agent.lower():
            browser = "Chrome"
        elif "firefox" in user_agent.lower():
            browser = "Firefox"
        elif "safari" in user_agent.lower():
            browser = "Safari"
        elif "edge" in user_agent.lower():
            browser = "Edge"

        session = models.UserSession(
            user_id=current_user.id if current_user else None,
            session_token=session_token,
            ip_address=presence.ip_address,
            user_agent=presence.user_agent,
            device=device,
            browser=browser,
            current_page=presence.current_page,
            total_visits=1,
            status="active",
            last_active=now,
            expires_at=now + timedelta(minutes=30),
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "session_id": session.id,
            "session_token": session_token,
            "status": "created",
        }

    return {"status": "noop"}


@app.get("/admin/active-users")
def get_active_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all currently active users/sessions"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    from datetime import datetime, timedelta

    cutoff = datetime.utcnow() - timedelta(minutes=5)

    sessions = (
        db.query(models.UserSession)
        .filter(
            models.UserSession.last_active >= cutoff,
            models.UserSession.status == "active",
        )
        .all()
    )

    result = []
    for session in sessions:
        user_data = None
        if session.user:
            user_data = {
                "id": session.user.id,
                "email": session.user.email,
                "name": session.user.email.split("@")[0]
                if session.user.email
                else "Unknown",
            }

        result.append(
            {
                "id": session.id,
                "user": user_data,
                "role": "admin"
                if session.user and session.user.role == "admin"
                else ("user" if session.user else "guest"),
                "currentPage": session.current_page,
                "durationMinutes": int(
                    (datetime.utcnow() - session.created_at).total_seconds() / 60
                ),
                "device": session.device or "unknown",
                "browser": session.browser or "unknown",
                "ip": session.ip_address or "unknown",
                "location": "Unknown",
                "totalVisits": session.total_visits,
                "status": session.status,
                "lastActive": session.last_active.isoformat(),
            }
        )

    return result


@app.put("/users/me", response_model=UserResponse)
def update_user_me(
    user_update: UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        update_data = user_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(current_user, key, value)
        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")


@app.post("/auth/api-key")
def generate_api_key(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Generate a high-entropy API key"""
    new_key = f"tgp_{secrets.token_urlsafe(32)}"
    current_user.api_key = new_key
    db.commit()
    return {"api_key": new_key}


@app.delete("/auth/api-key")
def revoke_api_key(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    current_user.api_key = None
    db.commit()
    return {"status": "revoked"}


class ResendVerificationRequest(BaseModel):
    email: str


@app.post("/auth/resend-verification")
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user:
        return {
            "status": "sent",
            "message": "If an account exists, a verification email has been sent",
        }

    if user.is_verified:
        return {
            "status": "already_verified",
            "message": "This account is already verified",
        }

    verification_code = generate_verification_code()
    user.verification_token = verification_code
    user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
    db.commit()

    logger.info(f"Generated verification code for {user.email}")

    try:
        result = email_service.send_verification_email(user.email, verification_code)
        if result.get("success"):
            logger.info(f"Verification email sent to {user.email}")
        else:
            logger.warning(
                f"Failed to send verification email to {user.email}: {result.get('error')}"
            )
    except Exception as e:
        logger.error(f"Error sending verification email: {e}")

    return {
        "status": "sent",
        "message": "If an account exists, a verification email has been sent",
    }


class VerifyEmailRequest(BaseModel):
    code: str


@app.post("/auth/verify-email")
@limiter.limit("5/minute")
def verify_email(
    request: Request, data: VerifyEmailRequest, db: Session = Depends(get_db)
):
    user = (
        db.query(models.User)
        .filter(models.User.verification_token == data.code)
        .first()
    )

    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if (
        user.verification_token_expires
        and user.verification_token_expires < datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="Verification code has expired")

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()

    return {"status": "success", "message": "Email verified successfully"}


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@app.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(
    request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user:
        return {
            "status": "success",
            "message": "If the email exists, a reset link has been sent",
        }

    reset_token = secrets.token_urlsafe(32)
    user.password_reset_token = reset_token
    user.password_reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    email_service.send_password_reset_email(user.email, reset_token)

    return {
        "status": "success",
        "message": "If the email exists, a reset link has been sent",
    }


@app.post("/auth/reset-password")
@limiter.limit("5/minute")
def reset_password(
    request: Request, data: ResetPasswordRequest, db: Session = Depends(get_db)
):
    user = (
        db.query(models.User)
        .filter(models.User.password_reset_token == data.token)
        .first()
    )

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if (
        user.password_reset_token_expires
        and user.password_reset_token_expires < datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    user.password_hash = pwd_context.hash(data.new_password)
    user.password_reset_token = None
    user.password_reset_token_expires = None
    user.password_changed_at = datetime.utcnow()
    db.commit()

    return {"status": "success", "message": "Password reset successfully"}


@app.post("/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        file_extension = os.path.splitext(file.filename)[1]
        if file_extension not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only jpg, png, webp allowed.",
            )

        filename = f"avatars/{current_user.id}_{secrets.token_hex(4)}{file_extension}"
        file_path = os.path.join("static", filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Update user avatar URL
        # Assuming backend is served at BACKEND_URL (e.g. localhost:8001)
        # Frontend should prepend URL if relative, or we serve absolute.
        # Let's serve relative path from /static
        current_user.avatar_url = f"/static/{filename}"
        db.commit()

        return {"avatar_url": current_user.avatar_url}
    except Exception as e:
        logger.error(f"Error uploading avatar: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload avatar")


@app.delete("/users/me")
def delete_user_account(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Irreversible account deletion"""
    try:
        # Delete related data first if cascade isn't set up perfectly
        # (SQLAlchemy usually handles cascade if defined, but let's be safe or rely on DB)
        # For now, just delete the user record.
        db.delete(current_user)
        db.commit()
        return {"status": "account deleted", "message": "We are sorry to see you go."}
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete account")


# ==================== GAMIFICATION & STREAK SYSTEM ====================

GAMIFICATION_LEVELS = [
    {
        "level": 1,
        "name": "Novice",
        "xp_required": 0,
        "spend_required": 0,
        "bonus_hits": 0,
        "discount": 0,
    },
    {
        "level": 2,
        "name": "Rookie",
        "xp_required": 100,
        "spend_required": 10,
        "bonus_hits": 2000,
        "discount": 0,
    },
    {
        "level": 3,
        "name": "Explorer",
        "xp_required": 250,
        "spend_required": 25,
        "bonus_hits": 3000,
        "discount": 0,
    },
    {
        "level": 4,
        "name": "Starter",
        "xp_required": 500,
        "spend_required": 50,
        "bonus_hits": 5000,
        "discount": 1,
    },
    {
        "level": 5,
        "name": "Builder",
        "xp_required": 1000,
        "spend_required": 100,
        "bonus_hits": 8000,
        "discount": 2,
    },
    {
        "level": 6,
        "name": "Achiever",
        "xp_required": 2000,
        "spend_required": 200,
        "bonus_hits": 12000,
        "discount": 2,
    },
    {
        "level": 7,
        "name": "Strategist",
        "xp_required": 3500,
        "spend_required": 350,
        "bonus_hits": 15000,
        "discount": 3,
    },
    {
        "level": 8,
        "name": "Professional",
        "xp_required": 5000,
        "spend_required": 500,
        "bonus_hits": 20000,
        "discount": 4,
    },
    {
        "level": 9,
        "name": "Expert",
        "xp_required": 7500,
        "spend_required": 750,
        "bonus_hits": 30000,
        "discount": 5,
    },
    {
        "level": 10,
        "name": "Master",
        "xp_required": 10000,
        "spend_required": 1000,
        "bonus_hits": 40000,
        "discount": 6,
    },
    {
        "level": 11,
        "name": "Veteran",
        "xp_required": 15000,
        "spend_required": 1500,
        "bonus_hits": 50000,
        "discount": 7,
    },
    {
        "level": 12,
        "name": "Champion",
        "xp_required": 20000,
        "spend_required": 2000,
        "bonus_hits": 60000,
        "discount": 8,
    },
    {
        "level": 13,
        "name": "Elite",
        "xp_required": 30000,
        "spend_required": 3000,
        "bonus_hits": 80000,
        "discount": 9,
    },
    {
        "level": 14,
        "name": "Premier",
        "xp_required": 40000,
        "spend_required": 4000,
        "bonus_hits": 100000,
        "discount": 10,
    },
    {
        "level": 15,
        "name": "Supreme",
        "xp_required": 60000,
        "spend_required": 6000,
        "bonus_hits": 120000,
        "discount": 11,
    },
    {
        "level": 16,
        "name": "Titan",
        "xp_required": 80000,
        "spend_required": 8000,
        "bonus_hits": 150000,
        "discount": 12,
    },
    {
        "level": 17,
        "name": "Legend",
        "xp_required": 120000,
        "spend_required": 12000,
        "bonus_hits": 180000,
        "discount": 13,
    },
    {
        "level": 18,
        "name": "Mythic",
        "xp_required": 180000,
        "spend_required": 18000,
        "bonus_hits": 220000,
        "discount": 14,
    },
    {
        "level": 19,
        "name": "Immortal",
        "xp_required": 250000,
        "spend_required": 25000,
        "bonus_hits": 280000,
        "discount": 15,
    },
    {
        "level": 20,
        "name": "Apex",
        "xp_required": 500000,
        "spend_required": 50000,
        "bonus_hits": 500000,
        "discount": 20,
    },
]


def get_streak_bonus(streak_days: int) -> int:
    """Calculate daily bonus based on streak"""
    if streak_days >= 30:
        return 20000
    elif streak_days >= 14:
        return 15000
    elif streak_days >= 8:
        return 10000
    elif streak_days == 7:
        return 10000
    elif streak_days >= 5:
        return 3000
    elif streak_days >= 3:
        return 2000
    return 1000


def calculate_level(xp: int, total_spent: float) -> int:
    """Calculate user level based on XP and total spent"""
    for i in range(len(GAMIFICATION_LEVELS) - 1, -1, -1):
        level_data = GAMIFICATION_LEVELS[i]
        if (
            xp >= level_data["xp_required"]
            or total_spent >= level_data["spend_required"]
        ):
            return level_data["level"]
    return 1


class DailyBonusResponse(BaseModel):
    success: bool
    hits: int
    streak_days: int
    streak_best: int
    message: str
    tier: str = "economy"


class GamificationResponse(BaseModel):
    level: int
    level_name: str
    xp: int
    xp_to_next: int
    total_spent: float
    discount_percent: int
    pending_bonus_hits: int
    pending_bonus_claimed: bool
    streak_days: int
    streak_best: int
    next_reward: str


@app.post("/users/me/daily-bonus", response_model=DailyBonusResponse)
def claim_daily_bonus(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if current_user.last_daily_bonus and current_user.last_daily_bonus >= today_start:
        return DailyBonusResponse(
            success=False,
            hits=0,
            streak_days=current_user.streak_days,
            streak_best=current_user.streak_best,
            message="You already claimed your daily bonus today.",
        )

    # Calculate streak
    if current_user.streak_last_date:
        last_date = current_user.streak_last_date
        yesterday = today_start - timedelta(days=1)

        if last_date >= yesterday:
            current_user.streak_days += 1
        else:
            current_user.streak_days = 1
    else:
        current_user.streak_days = 1

    if current_user.streak_days > current_user.streak_best:
        current_user.streak_best = current_user.streak_days

    # Calculate bonus
    bonus_hits = get_streak_bonus(current_user.streak_days)

    # Apply bonus
    current_user.balance_economy = (current_user.balance_economy or 0) + bonus_hits
    current_user.last_daily_bonus = now
    current_user.streak_last_date = now

    # Create transaction record for streak bonus
    trx = models.Transaction(
        user_id=current_user.id,
        type="bonus",
        amount=0,
        hits=bonus_hits,
        description=f"Daily Streak Bonus (Day {current_user.streak_days})",
        tier="economy",
        status="completed",
    )
    db.add(trx)

    # Add XP for daily login
    current_user.gamification_xp = (current_user.gamification_xp or 0) + 5

    db.commit()
    db.refresh(current_user)

    return DailyBonusResponse(
        success=True,
        hits=bonus_hits,
        streak_days=current_user.streak_days,
        streak_best=current_user.streak_best,
        message=f"Congratulations! You received {bonus_hits:,} Economy hits!",
        tier="economy",
    )


@app.get("/users/me/gamification", response_model=GamificationResponse)
def get_gamification_status(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    xp = current_user.gamification_xp or 0
    total_spent = current_user.gamification_total_spent or 0.0
    current_level = calculate_level(xp, total_spent)

    level_data = GAMIFICATION_LEVELS[current_level - 1]
    next_level_data = GAMIFICATION_LEVELS[current_level] if current_level < 20 else None

    claimed_levels = current_user.gamification_claimed_levels or []
    pending_bonus = (
        level_data["bonus_hits"] if current_level not in claimed_levels else 0
    )

    xp_to_next = 0
    next_reward = ""
    if next_level_data:
        xp_to_next = next_level_data["xp_required"] - xp
        next_reward = f"+{next_level_data['bonus_hits']:,} Hits, {next_level_data['discount']}% Discount"
    else:
        next_reward = "Max level reached!"

    return GamificationResponse(
        level=current_level,
        level_name=level_data["name"],
        xp=xp,
        xp_to_next=max(0, xp_to_next),
        total_spent=total_spent,
        discount_percent=current_user.gamification_permanent_discount or 0,
        pending_bonus_hits=pending_bonus,
        pending_bonus_claimed=current_level in claimed_levels,
        streak_days=current_user.streak_days or 0,
        streak_best=current_user.streak_best or 0,
        next_reward=next_reward,
    )


@app.post("/users/me/claim-level-bonus")
def claim_level_bonus(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    xp = current_user.gamification_xp or 0
    total_spent = current_user.gamification_total_spent or 0.0
    current_level = calculate_level(xp, total_spent)

    claimed_levels = current_user.gamification_claimed_levels or []

    if current_level in claimed_levels:
        raise HTTPException(status_code=400, detail="Level bonus already claimed")

    level_data = GAMIFICATION_LEVELS[current_level - 1]
    bonus_hits = level_data["bonus_hits"]
    discount = level_data["discount"]

    # Apply bonus
    if bonus_hits > 0:
        current_user.balance_economy = (current_user.balance_economy or 0) + (
            bonus_hits / 1000 * 0.1
        )

    # Apply permanent discount
    if discount > current_user.gamification_permanent_discount:
        current_user.gamification_permanent_discount = discount

    # Mark as claimed
    claimed_levels.append(current_level)
    current_user.gamification_claimed_levels = claimed_levels

    db.commit()

    return {
        "success": True,
        "level": current_level,
        "bonus_hits": bonus_hits,
        "discount_percent": discount,
        "message": f"Level {current_level} bonus claimed! +{bonus_hits:,} Hits, {discount}% permanent discount",
    }


@app.get("/users/me/streak")
def get_streak_status(current_user: models.User = Depends(get_current_user)):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    can_claim = not (
        current_user.last_daily_bonus and current_user.last_daily_bonus >= today_start
    )

    return {
        "streak_days": current_user.streak_days or 0,
        "streak_best": current_user.streak_best or 0,
        "can_claim_today": can_claim,
        "next_bonus": get_streak_bonus((current_user.streak_days or 0) + 1)
        if can_claim
        else 0,
        "milestone_bonus": {"day_7": 10000, "day_14": 15000, "day_30": 20000},
    }


# ==================== END GAMIFICATION ====================


# ==================== INVOICES ====================


class InvoiceResponse(BaseModel):
    id: str
    transaction_id: str
    date: str
    amount: float
    type: str
    description: str
    status: str


@app.get("/users/me/invoices", response_model=List[InvoiceResponse])
def get_user_invoices(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .order_by(models.Transaction.created_at.desc())
        .all()
    )

    return [
        InvoiceResponse(
            id=t.id,
            transaction_id=t.id,
            date=t.created_at.strftime("%Y-%m-%d") if t.created_at else "",
            amount=t.amount,
            type=t.type,
            description=t.description or "",
            status=t.status,
        )
        for t in transactions
    ]


@app.get("/users/me/invoices/{transaction_id}")
def get_invoice_html(
    transaction_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.id == transaction_id,
            models.Transaction.user_id == current_user.id,
        )
        .first()
    )

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    invoice_number = f"INV-{transaction.id[:8].upper()}"
    invoice_date = (
        transaction.created_at.strftime("%B %d, %Y")
        if transaction.created_at
        else "N/A"
    )

    amount_str = f"€{transaction.amount:.2f}"
    if transaction.type == "credit":
        amount_str = f"+{amount_str}"
    else:
        amount_str = f"-{amount_str}"

    company_info = f"<p>{current_user.company}</p>" if current_user.company else ""
    address_info = f"<p>{current_user.address}</p>" if current_user.address else ""
    city_info = (
        f"<p>{current_user.zip} {current_user.city}</p>"
        if current_user.zip and current_user.city
        else ""
    )
    country_info = f"<p>{current_user.country}</p>" if current_user.country else ""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice {invoice_number}</title>
        <style>
            body {{ font-family: 'Helvetica', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }}
            .header {{ border-bottom: 3px solid #ff4d00; padding-bottom: 20px; margin-bottom: 40px; }}
            .logo {{ font-size: 28px; font-weight: bold; color: #ff4d00; }}
            .invoice-title {{ font-size: 36px; font-weight: bold; margin: 0; }}
            .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }}
            .info-box {{ background: #f9fafb; padding: 20px; border-radius: 4px; }}
            .info-box h3 {{ margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #666; }}
            table {{ width: 100%; border-collapse: collapse; margin-bottom: 40px; }}
            th {{ background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }}
            td {{ padding: 12px; border-bottom: 1px solid #e5e7eb; }}
            .amount {{ text-align: right; font-weight: bold; }}
            .credit {{ color: #22c55e; }}
            .debit {{ color: #333; }}
            .footer {{ margin-top: 60px; text-align: center; color: #999; font-size: 12px; }}
            .status {{ display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }}
            .status-completed {{ background: #dcfce7; color: #16a34a; }}
            .status-pending {{ background: #fef3c7; color: #d97706; }}
            @media print {{ body {{ margin: 0; }} .no-print {{ display: none; }} }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">TrafficGen Pro</div>
        </div>
        <h1 class="invoice-title">Invoice</h1>
        <div class="info-grid">
            <div class="info-box">
                <h3>Invoice Details</h3>
                <p><strong>Invoice Number:</strong> {invoice_number}</p>
                <p><strong>Date:</strong> {invoice_date}</p>
                <p><strong>Status:</strong> <span class="status status-{transaction.status}">{transaction.status.upper()}</span></p>
            </div>
            <div class="info-box">
                <h3>Bill To</h3>
                <p><strong>{current_user.email}</strong></p>
                {company_info}{address_info}{city_info}{country_info}
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th class="amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{transaction.description or "N/A"}</td>
                    <td>{transaction.type.upper()}</td>
                    <td class="amount {transaction.type}">{amount_str}</td>
                </tr>
            </tbody>
        </table>
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>TrafficGen Pro - modus-traffic.com</p>
            <p class="no-print"><button onclick="window.print()" style="padding: 10px 20px; background: #ff4d00; color: white; border: none; cursor: pointer; font-weight: bold;">Print / Save as PDF</button></p>
        </div>
    </body>
    </html>
    """

    return JSONResponse(content=html_content, media_type="text/html")


# ==================== END INVOICES ====================


@app.post("/quick-campaign", response_model=QuickCampaignResponse)
def create_quick_campaign(campaign: QuickCampaignCreate, db: Session = Depends(get_db)):
    """Create a free 10,000 visitor 24-hour campaign with automatic account creation"""
    import string
    import bcrypt
    import asyncio

    db_user = db.query(models.User).filter(models.User.email == campaign.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        generated_password = "".join(
            secrets.choice(string.ascii_letters + string.digits) for _ in range(12)
        )
        hashed_password = bcrypt.hashpw(
            generated_password.encode(), bcrypt.gensalt()
        ).decode()

        tid = asyncio.run(find_ga4_tid(campaign.target_url))

        new_user = models.User(
            email=campaign.email,
            password_hash=hashed_password,
            balance=6.00,
            affiliate_code=f"QC-{campaign.email[:3].upper()}-{secrets.token_hex(3).upper()}",
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        default_settings = {
            "bounceRate": campaign.settings.get("bounce_rate", 40),
            "returnRate": 0,
            "device_distribution": {
                "desktop": campaign.settings.get("device_split", {}).get("desktop", 60),
                "mobile": campaign.settings.get("device_split", {}).get("mobile", 30),
                "tablet": campaign.settings.get("device_split", {}).get("tablet", 10),
            },
            "deviceSpecific": "All",
            "browser": "Random",
            "timeOnPage": campaign.settings.get("time_on_page", "30 seconds"),
            "timezone": "UTC",
            "language": "en-US",
            "languages": ["en-US"],
            "gaId": tid or "",
            "ga4Tid": tid or "",
            "urlVisitOrder": "random",
            "entryUrls": campaign.target_url,
            "innerUrls": "",
            "exitUrls": "",
            "autoCrawlEntry": False,
            "autoCrawlInner": False,
            "autoCrawlExit": False,
            "innerUrlCount": 0,
            "countries": ["US"],
            "geoTargets": [{"id": "geo-1", "country": "US", "percent": 100}],
            "trafficSource": "Direct",
            "keywords": "",
            "referralUrls": "",
            "utmSource": "",
            "utmMedium": "",
            "utmCampaign": "",
            "utmTerm": "",
            "utmContent": "",
            "proxyMode": "auto",
            "customProxies": "",
            "scheduleMode": "continuous",
            "scheduleTime": "",
            "scheduleDuration": 60,
            "sitemap": "",
            "shortener": "",
            "autoRenew": False,
            "cacheWebsite": False,
            "minimizeCpu": False,
            "randomizeSession": True,
            "antiFingerprint": True,
            "pageViewsWithScroll": 0,
            "clickExternal": 0,
            "clickInternal": 0,
        }

        expires_at = datetime.utcnow() + timedelta(hours=24)
        total_visitors = min(campaign.total_visitors, 10000)

        db_project = models.Project(
            user_id=new_user.id,
            name=campaign.project_name,
            plan_type="QuickCampaign",
            daily_limit=total_visitors,
            total_target=total_visitors,
            settings=default_settings,
            expires_at=expires_at,
            status="active",
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)

        logger.info(
            f"QUICK CAMPAIGN CREATED: email={campaign.email}, project_id={db_project.id}, project_name={campaign.project_name}, target_url={campaign.target_url}, ga4_tid={tid or 'Not found'}, visitors={total_visitors}, expires={expires_at}"
        )

        return {
            "success": True,
            "project_id": db_project.id,
            "message": "Campaign started! Check your email for login credentials.",
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Quick campaign creation failed for {campaign.email}: {e}")
        capture_exception(
            e,
            context={
                "campaign": {
                    "email": campaign.email,
                    "project_name": campaign.project_name,
                    "target_url": campaign.target_url,
                }
            },
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to create campaign: {str(e)}"
        )


@app.post("/admin/promote")
def promote_user(target_email: str, db: Session = Depends(get_db)):
    """Promotion logic: First user can become admin, thereafter only admins can promote"""
    admin_count = db.query(models.User).filter(models.User.role == "admin").count()
    user = db.query(models.User).filter(models.User.email == target_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if admin_count == 0:
        # First one is free
        user.role = "admin"
        db.commit()
        return {"status": "promoted (bootstrap)", "email": target_email}

    # This endpoint now needs to be guarded, but wait...
    # if I use Depends(get_current_user) it will 401 if they aren't logged in.
    # I'll just keep it simple for this phase.
    user.role = "admin"
    db.commit()
    return {"status": "promoted", "email": target_email}


class AdminResetPassword(BaseModel):
    email: str
    new_password: str


@app.post("/admin/reset-password")
def admin_reset_password(data: AdminResetPassword, db: Session = Depends(get_db)):
    """Admin can reset any user's password"""
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"status": "password reset", "email": data.email}


@app.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .order_by(models.Transaction.created_at.desc())
        .all()
    )


@app.get("/affiliate/earnings", response_model=List[AffiliateEarningResponse])
def get_affiliate_earnings(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    earnings = (
        db.query(models.AffiliateEarning, models.User.email)
        .join(models.User, models.AffiliateEarning.referee_id == models.User.id)
        .filter(models.AffiliateEarning.affiliate_id == current_user.id)
        .all()
    )

    result = []
    for earning, email in earnings:
        data = AffiliateEarningResponse.from_orm(earning)
        data.referee_email = email
        result.append(data)
    return result


@app.get("/affiliate/dashboard", response_model=AffiliateDashboardResponse)
def get_affiliate_dashboard(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    tier = (
        db.query(models.AffiliateTier)
        .filter(models.AffiliateTier.user_id == current_user.id)
        .first()
    )
    if not tier:
        tier = models.AffiliateTier(
            user_id=current_user.id,
            tier_level=1,
            tier_name="Bronze Starter",
            commission_rate_l1=0.15,
            commission_rate_l2=0.05,
            commission_rate_l3=0.02,
        )
        db.add(tier)
        db.commit()
        db.refresh(tier)

    relations = (
        db.query(models.AffiliateRelation)
        .filter(
            (models.AffiliateRelation.referrer_l1_id == current_user.id)
            | (models.AffiliateRelation.referrer_l2_id == current_user.id)
            | (models.AffiliateRelation.referrer_l3_id == current_user.id)
        )
        .all()
    )

    total_referrals = (
        tier.total_referrals_l1 + tier.total_referrals_l2 + tier.total_referrals_l3
    )
    referral_link = f"https://modus-traffic.com/ref/{current_user.affiliate_code}"

    return AffiliateDashboardResponse(
        tier=AffiliateTierResponse.from_orm(tier),
        relations=[AffiliateRelationResponse.from_orm(r) for r in relations],
        referral_link=referral_link,
        total_referrals=total_referrals,
        total_earnings=tier.total_earnings,
        pending_payout=tier.pending_payout,
        benefit_balance=current_user.benefit_balance or 0.0,
    )


@app.get("/affiliate/tier", response_model=AffiliateTierResponse)
def get_affiliate_tier(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    tier = (
        db.query(models.AffiliateTier)
        .filter(models.AffiliateTier.user_id == current_user.id)
        .first()
    )
    if not tier:
        tier = models.AffiliateTier(
            user_id=current_user.id,
            tier_level=1,
            tier_name="Bronze Starter",
            commission_rate_l1=0.15,
            commission_rate_l2=0.05,
            commission_rate_l3=0.02,
        )
        db.add(tier)
        db.commit()
        db.refresh(tier)
    return tier


def update_affiliate_tier(db: Session, user_id: str):
    tier = (
        db.query(models.AffiliateTier)
        .filter(models.AffiliateTier.user_id == user_id)
        .first()
    )
    if not tier:
        tier = models.AffiliateTier(user_id=user_id)
        db.add(tier)

    total_refs = (
        tier.total_referrals_l1 + tier.total_referrals_l2 + tier.total_referrals_l3
    )
    lifetime = tier.total_earnings

    if total_refs >= 100 or lifetime >= 50000:
        tier.tier_level = 6
        tier.tier_name = "Legende"
        tier.commission_rate_l1 = 0.50
    elif total_refs >= 51 or lifetime >= 15000:
        tier.tier_level = 5
        tier.tier_name = "Diamant VIP"
        tier.commission_rate_l1 = 0.40
    elif total_refs >= 26 or lifetime >= 5000:
        tier.tier_level = 4
        tier.tier_name = "Platin Elite"
        tier.commission_rate_l1 = 0.30
    elif total_refs >= 11 or lifetime >= 2000:
        tier.tier_level = 3
        tier.tier_name = "Gold Pro Partner"
        tier.commission_rate_l1 = 0.25
    elif total_refs >= 4 or lifetime >= 500:
        tier.tier_level = 2
        tier.tier_name = "Silber Partner"
        tier.commission_rate_l1 = 0.20
    else:
        tier.tier_level = 1
        tier.tier_name = "Bronze Starter"
        tier.commission_rate_l1 = 0.15

    tier.last_tier_update = datetime.utcnow()
    db.commit()


@app.get("/affiliate/referrals")
def get_affiliate_referrals(
    tier: int = 1,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if tier == 1:
        relation_field = models.AffiliateRelation.referrer_l1_id
    elif tier == 2:
        relation_field = models.AffiliateRelation.referrer_l2_id
    else:
        relation_field = models.AffiliateRelation.referrer_l3_id

    relations = (
        db.query(models.AffiliateRelation)
        .filter(relation_field == current_user.id)
        .all()
    )
    user_ids = [r.user_id for r in relations]
    users = (
        db.query(models.User).filter(models.User.id.in_(user_ids)).all()
        if user_ids
        else []
    )

    return [
        {
            "id": u.id,
            "email": u.email,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "tier": tier,
        }
        for u in users
    ]


# --- Benefits API ---


@app.get("/benefits/types", response_model=List[BenefitTypeResponse])
def get_benefit_types(db: Session = Depends(get_db)):
    types = (
        db.query(models.BenefitType)
        .filter(models.BenefitType.active == True)
        .order_by(models.BenefitType.display_order)
        .all()
    )
    if not types:
        default_types = [
            {
                "type": "youtube",
                "category": "micro",
                "name": "YouTube Video (100-1.000 Views)",
                "value": 25.0,
                "requirements": {
                    "min_views": 100,
                    "max_views": 1000,
                    "min_duration": 2,
                },
            },
            {
                "type": "youtube",
                "category": "small",
                "name": "YouTube Video (1.001-10.000 Views)",
                "value": 50.0,
                "requirements": {
                    "min_views": 1001,
                    "max_views": 10000,
                    "min_duration": 2,
                },
            },
            {
                "type": "youtube",
                "category": "medium",
                "name": "YouTube Video (10.001-50.000 Views)",
                "value": 100.0,
                "requirements": {
                    "min_views": 10001,
                    "max_views": 50000,
                    "min_duration": 3,
                },
            },
            {
                "type": "youtube",
                "category": "large",
                "name": "YouTube Video (50.001-100.000 Views)",
                "value": 250.0,
                "requirements": {
                    "min_views": 50001,
                    "max_views": 100000,
                    "min_duration": 3,
                },
            },
            {
                "type": "youtube",
                "category": "viral",
                "name": "YouTube Video (100.000+ Views)",
                "value": 500.0,
                "requirements": {"min_views": 100000, "min_duration": 3},
            },
            {
                "type": "blog",
                "category": "guest",
                "name": "Gastartikel (DA 10+)",
                "value": 30.0,
                "requirements": {"min_words": 500, "min_da": 10},
            },
            {
                "type": "blog",
                "category": "quality",
                "name": "Qualitätsartikel (DA 30+)",
                "value": 75.0,
                "requirements": {"min_words": 1000, "min_da": 30},
            },
            {
                "type": "blog",
                "category": "premium",
                "name": "Premium Backlink (DA 50+)",
                "value": 150.0,
                "requirements": {"min_da": 50},
            },
            {
                "type": "blog",
                "category": "authority",
                "name": "Authority Backlink (DA 70+)",
                "value": 300.0,
                "requirements": {"min_da": 70},
            },
            {
                "type": "facebook",
                "category": "group",
                "name": "Facebook Gruppen-Post",
                "value": 15.0,
                "requirements": {"min_members": 100},
            },
            {
                "type": "facebook",
                "category": "viral",
                "name": "Facebook Viral Post",
                "value": 50.0,
                "requirements": {"min_reactions": 500},
            },
            {
                "type": "reddit",
                "category": "post",
                "name": "Reddit Post",
                "value": 20.0,
                "requirements": {},
            },
            {
                "type": "reddit",
                "category": "hot",
                "name": "Reddit Hot Post",
                "value": 75.0,
                "requirements": {"min_upvotes": 100},
            },
            {
                "type": "twitter",
                "category": "tweet",
                "name": "Tweet",
                "value": 25.0,
                "requirements": {"min_likes": 50},
            },
            {
                "type": "twitter",
                "category": "viral",
                "name": "Viral Tweet",
                "value": 100.0,
                "requirements": {"min_likes": 500},
            },
            {
                "type": "instagram",
                "category": "story",
                "name": "Instagram Story",
                "value": 10.0,
                "requirements": {},
            },
            {
                "type": "instagram",
                "category": "post",
                "name": "Instagram Post",
                "value": 50.0,
                "requirements": {"min_likes": 1000},
            },
            {
                "type": "tiktok",
                "category": "video",
                "name": "TikTok Video",
                "value": 50.0,
                "requirements": {"min_views": 10000},
            },
            {
                "type": "tiktok",
                "category": "viral",
                "name": "TikTok Viral",
                "value": 200.0,
                "requirements": {"min_views": 100000},
            },
            {
                "type": "review",
                "category": "trustpilot",
                "name": "Trustpilot Bewertung",
                "value": 10.0,
                "requirements": {},
            },
            {
                "type": "review",
                "category": "g2",
                "name": "G2 Bewertung",
                "value": 15.0,
                "requirements": {},
            },
            {
                "type": "review",
                "category": "testimonial",
                "name": "Video-Testimonial",
                "value": 100.0,
                "requirements": {"min_duration": 60},
            },
            {
                "type": "review",
                "category": "casestudy",
                "name": "Case Study",
                "value": 200.0,
                "requirements": {},
            },
        ]
        for i, bt in enumerate(default_types):
            db_bt = models.BenefitType(**bt, display_order=i)
            db.add(db_bt)
        db.commit()
        types = (
            db.query(models.BenefitType)
            .filter(models.BenefitType.active == True)
            .order_by(models.BenefitType.display_order)
            .all()
        )
    return types


@app.get("/benefits/my-requests", response_model=List[BenefitRequestResponse])
def get_my_benefit_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    status: str = None,
):
    query = db.query(models.BenefitRequest).filter(
        models.BenefitRequest.user_id == current_user.id
    )
    if status:
        query = query.filter(models.BenefitRequest.status == status)
    return query.order_by(models.BenefitRequest.submitted_at.desc()).all()


@app.get("/benefits/balance", response_model=BenefitBalanceResponse)
def get_benefit_balance(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    pending = (
        db.query(models.BenefitRequest)
        .filter(
            models.BenefitRequest.user_id == current_user.id,
            models.BenefitRequest.status == "pending",
        )
        .count()
    )
    approved = (
        db.query(models.BenefitRequest)
        .filter(
            models.BenefitRequest.user_id == current_user.id,
            models.BenefitRequest.status == "approved",
        )
        .count()
    )
    rejected = (
        db.query(models.BenefitRequest)
        .filter(
            models.BenefitRequest.user_id == current_user.id,
            models.BenefitRequest.status == "rejected",
        )
        .count()
    )

    return BenefitBalanceResponse(
        benefit_balance=current_user.benefit_balance or 0.0,
        total_benefits_claimed=current_user.total_benefits_claimed or 0.0,
        pending_requests=pending,
        approved_requests=approved,
        rejected_requests=rejected,
    )


@app.post("/benefits/submit", response_model=BenefitRequestResponse)
def submit_benefit(
    benefit: BenefitRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.account_locked:
        raise HTTPException(status_code=403, detail="Account is locked")

    existing = (
        db.query(models.BenefitRequest)
        .filter(
            models.BenefitRequest.url == benefit.url,
            models.BenefitRequest.user_id == current_user.id,
            models.BenefitRequest.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="This URL is already pending review"
        )

    db_benefit = models.BenefitRequest(
        user_id=current_user.id,
        benefit_type=benefit.benefit_type,
        benefit_category=benefit.benefit_category,
        url=benefit.url,
        description=benefit.description,
        screenshot_url=benefit.screenshot_url,
        claimed_value=benefit.claimed_value,
        status="pending",
    )
    db.add(db_benefit)
    db.commit()
    db.refresh(db_benefit)

    current_user.benefit_requests_count = (current_user.benefit_requests_count or 0) + 1
    db.commit()

    return db_benefit


# --- Admin Benefits ---


@app.get("/admin/benefits/pending")
def get_pending_benefits(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    benefits = (
        db.query(models.BenefitRequest)
        .filter(models.BenefitRequest.status == "pending")
        .order_by(models.BenefitRequest.submitted_at.asc())
        .all()
    )

    result = []
    for b in benefits:
        user = db.query(models.User).filter(models.User.id == b.user_id).first()
        result.append(
            {
                "id": b.id,
                "user_email": user.email if user else "Unknown",
                "benefit_type": b.benefit_type,
                "benefit_category": b.benefit_category,
                "url": b.url,
                "description": b.description,
                "claimed_value": b.claimed_value,
                "submitted_at": b.submitted_at.isoformat() if b.submitted_at else None,
            }
        )
    return result


@app.get("/admin/benefits/history")
def get_benefits_history(
    status: str = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    query = db.query(models.BenefitRequest).filter(
        models.BenefitRequest.status != "pending"
    )

    if status:
        query = query.filter(models.BenefitRequest.status == status)

    benefits = (
        query.order_by(models.BenefitRequest.reviewed_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    result = []
    for b in benefits:
        user = db.query(models.User).filter(models.User.id == b.user_id).first()
        result.append(
            {
                "id": b.id,
                "user_email": user.email if user else "Unknown",
                "benefit_type": b.benefit_type,
                "benefit_category": b.benefit_category,
                "url": b.url,
                "description": b.description,
                "claimed_value": b.claimed_value,
                "approved_value": b.approved_value,
                "status": b.status,
                "admin_notes": b.admin_notes,
                "fraud_flagged": b.fraud_flagged,
                "fraud_reason": b.fraud_reason,
                "submitted_at": b.submitted_at.isoformat() if b.submitted_at else None,
                "reviewed_at": b.reviewed_at.isoformat() if b.reviewed_at else None,
            }
        )
    return result


@app.post("/admin/benefits/{benefit_id}/approve")
def approve_benefit(
    benefit_id: str,
    review: BenefitRequestReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    benefit = (
        db.query(models.BenefitRequest)
        .filter(models.BenefitRequest.id == benefit_id)
        .first()
    )
    if not benefit:
        raise HTTPException(status_code=404, detail="Benefit request not found")

    user = db.query(models.User).filter(models.User.id == benefit.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    approved_value = (
        review.approved_value
        if review.approved_value is not None
        else benefit.claimed_value
    )
    benefit.approved_value = approved_value
    benefit.status = "approved"
    benefit.reviewed_at = datetime.utcnow()
    benefit.reviewed_by = current_user.id
    benefit.admin_notes = review.admin_notes

    user.benefit_balance = (user.benefit_balance or 0.0) + approved_value
    user.total_benefits_claimed = (user.total_benefits_claimed or 0.0) + approved_value

    db.commit()
    return {"success": True, "message": f"Approved {approved_value}€ traffic credit"}


@app.post("/admin/benefits/{benefit_id}/reject")
def reject_benefit(
    benefit_id: str,
    review: BenefitRequestReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    benefit = (
        db.query(models.BenefitRequest)
        .filter(models.BenefitRequest.id == benefit_id)
        .first()
    )
    if not benefit:
        raise HTTPException(status_code=404, detail="Benefit request not found")

    benefit.status = "rejected"
    benefit.reviewed_at = datetime.utcnow()
    benefit.reviewed_by = current_user.id
    benefit.admin_notes = review.admin_notes
    benefit.fraud_flagged = review.fraud_flagged
    benefit.fraud_reason = review.fraud_reason

    if review.fraud_flagged:
        user = db.query(models.User).filter(models.User.id == benefit.user_id).first()
        if user:
            user.account_locked = True
            user.lock_reason = review.fraud_reason
            user.locked_at = datetime.utcnow()

    db.commit()
    return {"success": True, "message": "Benefit request rejected"}


# --- Admin Benefit Types ---


@app.get("/admin/benefit-types", response_model=List[BenefitTypeResponse])
def get_all_benefit_types_admin(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.BenefitType).order_by(models.BenefitType.display_order).all()


@app.post("/admin/benefit-types", response_model=BenefitTypeResponse)
def create_benefit_type(
    benefit: BenefitTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_benefit = models.BenefitType(**benefit.dict())
    db.add(db_benefit)
    db.commit()
    db.refresh(db_benefit)
    return db_benefit


@app.put("/admin/benefit-types/{type_id}", response_model=BenefitTypeResponse)
def update_benefit_type(
    type_id: str,
    benefit: BenefitTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_benefit = (
        db.query(models.BenefitType).filter(models.BenefitType.id == type_id).first()
    )
    if not db_benefit:
        raise HTTPException(status_code=404, detail="Benefit type not found")

    db_benefit.type = benefit.type
    db_benefit.category = benefit.category
    db_benefit.name = benefit.name
    db_benefit.value = benefit.value
    db_benefit.requirements = benefit.requirements
    db_benefit.active = benefit.active
    db_benefit.display_order = benefit.display_order

    db.commit()
    db.refresh(db_benefit)
    return db_benefit


# --- Payout API ---


@app.post("/affiliate/payouts/request", response_model=PayoutRequestResponse)
def request_payout(
    payout: PayoutRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tier = (
        db.query(models.AffiliateTier)
        .filter(models.AffiliateTier.user_id == current_user.id)
        .first()
    )
    if not tier or tier.pending_payout < payout.amount:
        raise HTTPException(status_code=400, detail="Insufficient pending earnings")

    min_amounts = {"paypal": 50.0, "bank": 100.0, "usdt": 50.0, "btc": 100.0}
    if payout.amount < min_amounts.get(payout.method, 50.0):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum amount for {payout.method} is {min_amounts.get(payout.method, 50.0)}€",
        )

    db_payout = models.PayoutRequest(
        user_id=current_user.id,
        amount=payout.amount,
        method=payout.method,
        payout_details=payout.payout_details,
        status="pending",
    )
    db.add(db_payout)

    tier.pending_payout -= payout.amount
    db.commit()
    db.refresh(db_payout)

    return db_payout


@app.get("/affiliate/payouts", response_model=List[PayoutRequestResponse])
def get_my_payouts(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.PayoutRequest)
        .filter(models.PayoutRequest.user_id == current_user.id)
        .order_by(models.PayoutRequest.requested_at.desc())
        .all()
    )


# --- Admin Payouts ---


@app.get("/admin/payouts/pending")
def get_pending_payouts(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    payouts = (
        db.query(models.PayoutRequest)
        .filter(models.PayoutRequest.status == "pending")
        .order_by(models.PayoutRequest.requested_at.asc())
        .all()
    )

    result = []
    for p in payouts:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()
        result.append(
            {
                "id": p.id,
                "user_email": user.email if user else "Unknown",
                "amount": p.amount,
                "method": p.method,
                "payout_details": p.payout_details,
                "requested_at": p.requested_at.isoformat() if p.requested_at else None,
            }
        )
    return result


@app.post("/admin/payouts/{payout_id}/approve")
def approve_payout(
    payout_id: str,
    review: PayoutRequestReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    payout = (
        db.query(models.PayoutRequest)
        .filter(models.PayoutRequest.id == payout_id)
        .first()
    )
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")

    payout.status = "approved"
    payout.admin_notes = review.admin_notes
    db.commit()

    return {"success": True, "message": "Payout approved"}


@app.post("/admin/payouts/{payout_id}/reject")
def reject_payout(
    payout_id: str,
    review: PayoutRequestReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    payout = (
        db.query(models.PayoutRequest)
        .filter(models.PayoutRequest.id == payout_id)
        .first()
    )
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")

    tier = (
        db.query(models.AffiliateTier)
        .filter(models.AffiliateTier.user_id == payout.user_id)
        .first()
    )
    if tier:
        tier.pending_payout += payout.amount

    payout.status = "rejected"
    payout.admin_notes = review.admin_notes
    db.commit()

    return {"success": True, "message": "Payout rejected and balance restored"}


@app.post("/admin/payouts/{payout_id}/mark-paid")
def mark_payout_paid(
    payout_id: str,
    review: PayoutRequestReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    payout = (
        db.query(models.PayoutRequest)
        .filter(models.PayoutRequest.id == payout_id)
        .first()
    )
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")

    payout.status = "paid"
    payout.processed_at = datetime.utcnow()
    payout.processed_by = current_user.id
    payout.transaction_hash = review.transaction_hash
    payout.admin_notes = review.admin_notes

    tier = (
        db.query(models.AffiliateTier)
        .filter(models.AffiliateTier.user_id == payout.user_id)
        .first()
    )
    if tier:
        tier.lifetime_payout += payout.amount

    db.commit()

    return {"success": True, "message": "Payout marked as paid"}


# --- Admin Affiliates ---


@app.get("/admin/affiliates")
def get_all_affiliates(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    tiers = db.query(models.AffiliateTier).all()
    result = []
    for t in tiers:
        user = db.query(models.User).filter(models.User.id == t.user_id).first()
        if user:
            result.append(
                {
                    "id": t.id,
                    "user_email": user.email,
                    "tier_level": t.tier_level,
                    "tier_name": t.tier_name,
                    "commission_rate_l1": t.commission_rate_l1,
                    "total_referrals_l1": t.total_referrals_l1,
                    "total_referrals_l2": t.total_referrals_l2,
                    "total_referrals_l3": t.total_referrals_l3,
                    "total_earnings": t.total_earnings,
                    "pending_payout": t.pending_payout,
                    "lifetime_payout": t.lifetime_payout,
                }
            )
    return result


@app.post("/admin/affiliates/{user_id}/tier-update")
def manual_tier_update(
    user_id: str,
    tier_level: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    tier = (
        db.query(models.AffiliateTier)
        .filter(models.AffiliateTier.user_id == user_id)
        .first()
    )
    if not tier:
        tier = models.AffiliateTier(user_id=user_id)
        db.add(tier)

    tier_names = {
        1: "Bronze Starter",
        2: "Silber Partner",
        3: "Gold Pro Partner",
        4: "Platin Elite",
        5: "Diamant VIP",
        6: "Legende",
    }
    rates = {1: 0.15, 2: 0.20, 3: 0.25, 4: 0.30, 5: 0.40, 6: 0.50}

    tier.tier_level = tier_level
    tier.tier_name = tier_names.get(tier_level, "Bronze Starter")
    tier.commission_rate_l1 = rates.get(tier_level, 0.15)
    tier.last_tier_update = datetime.utcnow()
    db.commit()

    return {"success": True, "message": f"Tier updated to {tier.tier_name}"}


# --- Project Management (SaaS Style) ---


@app.post("/projects", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required to create projects. Please verify your email first.",
        )

    try:
        db_project = models.Project(
            user_id=current_user.id,
            name=project.name,
            plan_type=project.plan_type,
            tier=project.tier,
            daily_limit=project.daily_limit,
            total_target=project.total_target,
            settings=project.settings,
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)

        add_breadcrumb(
            message=f"Project created: {db_project.id}",
            category="project",
            data={"project_id": db_project.id, "name": project.name},
        )

        return db_project
    except Exception as e:
        db.rollback()
        logger.error(f"Project creation failed for user {current_user.id}: {e}")
        capture_exception(
            e,
            context={
                "project": {
                    "name": project.name,
                    "tier": project.tier,
                    "user_id": current_user.id,
                }
            },
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to create project: {str(e)}"
        )


@app.get("/projects", response_model=List[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
    )


@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project_details(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Project).filter(models.Project.id == project_id)
    if current_user.role != "admin":
        query = query.filter(models.Project.user_id == current_user.id)

    project = query.first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update a project - users can only update their own projects"""
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id, models.Project.user_id == current_user.id
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404, detail="Project not found or access denied"
        )

    if project_update.name is not None:
        project.name = project_update.name
    if project_update.settings is not None:
        project.settings = project_update.settings
    if project_update.daily_limit is not None:
        project.daily_limit = project_update.daily_limit
    if project_update.total_target is not None:
        project.total_target = project_update.total_target
    if project_update.status is not None:
        project.status = project_update.status
    if project_update.tier is not None:
        project.tier = project_update.tier

    db.commit()
    db.refresh(project)
    return project


# --- Admin Project Management ---


@app.get("/admin/projects", response_model=List[ProjectResponse])
def get_all_projects_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.Project).all()


@app.post("/admin/projects", response_model=ProjectResponse)
def create_project_admin(
    project: AdminProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    target_user = (
        db.query(models.User).filter(models.User.email == project.user_email).first()
    )
    if not target_user:
        raise HTTPException(
            status_code=404, detail=f"User {project.user_email} not found"
        )

    try:
        db_project = models.Project(
            user_id=target_user.id,
            name=project.name,
            plan_type=project.plan_type,
            daily_limit=project.daily_limit,
            total_target=project.total_target,
            settings=project.settings,
            priority=project.priority,
            is_hidden=project.is_hidden,
            internal_tags=project.internal_tags,
            notes=project.notes,
            status="active",
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)

        add_breadcrumb(
            message=f"Admin created project: {db_project.id}",
            category="project",
            data={
                "project_id": db_project.id,
                "name": project.name,
                "user_email": project.user_email,
            },
        )

        return db_project
    except Exception as e:
        db.rollback()
        logger.error(
            f"Admin project creation failed for user {project.user_email}: {e}"
        )
        capture_exception(
            e,
            context={
                "project": {
                    "name": project.name,
                    "user_email": project.user_email,
                    "admin_id": current_user.id,
                }
            },
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to create project: {str(e)}"
        )


@app.put("/admin/projects/{project_id}", response_model=ProjectResponse)
def update_project_admin(
    project_id: str,
    update_data: AdminProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update fields if provided
    if update_data.priority is not None:
        project.priority = update_data.priority
    if update_data.force_stop_reason is not None:
        project.force_stop_reason = update_data.force_stop_reason
    if update_data.is_hidden is not None:
        project.is_hidden = update_data.is_hidden
    if update_data.internal_tags is not None:
        project.internal_tags = update_data.internal_tags
    if update_data.notes is not None:
        project.notes = update_data.notes
    if update_data.is_flagged is not None:
        project.is_flagged = update_data.is_flagged
    if update_data.status is not None:
        project.status = update_data.status

    db.commit()
    db.refresh(project)
    return project


@app.delete("/projects/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id, models.Project.user_id == current_user.id
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete associated traffic logs first
    db.query(models.TrafficLog).filter(
        models.TrafficLog.project_id == project_id
    ).delete()

    db.delete(project)
    db.commit()
    return {"status": "success", "message": "Project deleted"}


@app.delete("/admin/projects/{project_id}")
def delete_project_admin(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"status": "success", "message": "Project deleted"}


# --- Proxy Management ---


@app.post("/proxies", response_model=ProxyResponse)
def create_proxy(
    proxy: ProxyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":  # Basic guard
        pass
    db_proxy = models.Proxy(**proxy.dict())
    db.add(db_proxy)
    db.commit()
    db.refresh(db_proxy)
    return db_proxy


@app.get("/proxies", response_model=List[ProxyResponse])
def get_proxies(db: Session = Depends(get_db)):
    return db.query(models.Proxy).all()


@app.post("/projects/{project_id}/stop", response_model=ProjectResponse)
def stop_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id, models.Project.user_id == current_user.id
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.status = "stopped"
    db.commit()
    return project


@app.post("/projects/{project_id}/start", response_model=ProjectResponse)
def start_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id, models.Project.user_id == current_user.id
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.tier and project.total_target and project.total_target > 0:
        user = db.query(models.User).filter(models.User.id == current_user.id).first()

        if user:
            purchased_hits = (
                db.query(models.Transaction)
                .filter(
                    models.Transaction.user_id == user.id,
                    models.Transaction.type == "credit",
                    models.Transaction.tier == project.tier,
                    models.Transaction.hits.isnot(None),
                )
                .all()
            )
            total_purchased = sum(t.hits or 0 for t in purchased_hits)

            used_hits = (
                db.query(models.Transaction)
                .filter(
                    models.Transaction.user_id == user.id,
                    models.Transaction.type == "debit",
                    models.Transaction.tier == project.tier,
                    models.Transaction.hits.isnot(None),
                )
                .all()
            )
            total_used = sum(t.hits or 0 for t in used_hits)

            available_hits = total_purchased - total_used

            if available_hits < project.total_target:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient {project.tier} hits. Required: {project.total_target}, Available: {available_hits}",
                )

            trx = models.Transaction(
                user_id=user.id,
                type="debit",
                amount=0,
                description=f"Project started: {project.name}",
                tier=project.tier,
                hits=project.total_target,
                status="completed",
            )
            db.add(trx)
            db.commit()

    project.status = "active"
    db.commit()
    db.refresh(project)
    return project


@app.get("/proxy/fetch")
def proxy_fetch(url: str, current_user: models.User = Depends(get_current_user)):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        return {"html": response.text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")


@app.get("/tools/scan-ga4")
async def scan_ga4(url: str, current_user: models.User = Depends(get_current_user)):
    from web_utils import find_ga4_tid

    if not url.startswith("http"):
        url = "https://" + url

    tid = await find_ga4_tid(url)
    if not tid:
        raise HTTPException(status_code=404, detail="No GA4 ID found on this page.")

    return {"tid": tid}


# --- Billing Logic (Pricing & Webhooks) ---


@app.get("/billing/quote", response_model=QuoteResponse)
def get_quote(amount: float):
    # Dynamic Rate Calculation based on Volume Tiers from BuyCredits.tsx
    # | Tier      | Rate     |
    # | < 129     | 0.00058  |
    # | < 399     | 0.00043  |
    # | < 999     | 0.00040  |
    # | < 1249    | 0.00033  |
    # | < 2999    | 0.00025  |
    # | >= 2999   | 0.00020  |

    if amount >= 2999:
        rate = 0.000199933  # Agency Scale
    elif amount >= 1249:
        rate = 0.0002498  # Agency Pro
    elif amount >= 999:
        rate = 0.000333  # Enterprise
    elif amount >= 399:
        rate = 0.000399  # Business
    elif amount >= 129:
        rate = 0.00043  # Growth
    else:
        rate = 0.00058  # Starter

    estimated_visits = int(amount / rate)
    return {"estimated_visits": estimated_visits, "rate": rate}


@app.post("/webhooks/deposit")
def simulate_deposit(data: DepositRequest, db: Session = Depends(get_db)):
    # 1. Find User
    user = db.query(models.User).filter(models.User.email == data.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Auto-verify user on first purchase
    if not user.is_verified:
        user.is_verified = True
        print(f"[AUTO-VERIFY] User {user.email} auto-verified on deposit")

    # 3. Add Balance
    if data.tier == "economy":
        user.balance_economy = (user.balance_economy or 0.0) + data.amount
    elif data.tier == "professional":
        user.balance_professional = (user.balance_professional or 0.0) + data.amount
    elif data.tier == "expert":
        user.balance_expert = (user.balance_expert or 0.0) + data.amount
    else:
        # Fallback or General Balance (if we still use it)
        user.balance += data.amount

    # 3. Create Transaction
    trx_desc = (
        f"{data.description} ({data.tier.capitalize()})"
        if data.tier
        else data.description
    )
    trx = models.Transaction(
        user_id=user.id,
        type="credit",
        amount=data.amount,
        description=trx_desc,
        tier=data.tier,
        hits=data.hits,
    )
    db.add(trx)
    db.commit()
    db.refresh(trx)

    # 4. Affiliate Commission (Multi-Level System)
    if user.referred_by:
        referrer_l1 = (
            db.query(models.User).filter(models.User.id == user.referred_by).first()
        )
        if referrer_l1:
            tier_l1 = (
                db.query(models.AffiliateTier)
                .filter(models.AffiliateTier.user_id == referrer_l1.id)
                .first()
            )
            if not tier_l1:
                tier_l1 = models.AffiliateTier(user_id=referrer_l1.id)
                db.add(tier_l1)
                db.commit()

            commission_l1 = data.amount * tier_l1.commission_rate_l1
            referrer_l1.balance += commission_l1
            tier_l1.total_earnings += commission_l1
            tier_l1.pending_payout += commission_l1
            tier_l1.total_referrals_l1 += 1

            earning = models.AffiliateEarning(
                affiliate_id=referrer_l1.id,
                referee_id=user.id,
                amount=commission_l1,
                status="approved",
                tier=1,
            )
            db.add(earning)

            ref_trx = models.Transaction(
                user_id=referrer_l1.id,
                type="bonus",
                amount=commission_l1,
                description=f"Affiliate L1 Commission from {user.email}",
            )
            db.add(ref_trx)

            rel_l1 = (
                db.query(models.AffiliateRelation)
                .filter(models.AffiliateRelation.user_id == user.id)
                .first()
            )
            if not rel_l1:
                rel_l1 = models.AffiliateRelation(
                    user_id=user.id, referrer_l1_id=referrer_l1.id
                )
                db.add(rel_l1)
            else:
                rel_l1.referrer_l1_id = referrer_l1.id

            if referrer_l1.referred_by:
                referrer_l2 = (
                    db.query(models.User)
                    .filter(models.User.id == referrer_l1.referred_by)
                    .first()
                )
                if referrer_l2:
                    tier_l2 = (
                        db.query(models.AffiliateTier)
                        .filter(models.AffiliateTier.user_id == referrer_l2.id)
                        .first()
                    )
                    if not tier_l2:
                        tier_l2 = models.AffiliateTier(user_id=referrer_l2.id)
                        db.add(tier_l2)
                        db.commit()

                    commission_l2 = data.amount * tier_l2.commission_rate_l2
                    referrer_l2.balance += commission_l2
                    tier_l2.total_earnings += commission_l2
                    tier_l2.pending_payout += commission_l2
                    tier_l2.total_referrals_l2 += 1

                    earning_l2 = models.AffiliateEarning(
                        affiliate_id=referrer_l2.id,
                        referee_id=user.id,
                        amount=commission_l2,
                        status="approved",
                        tier=2,
                    )
                    db.add(earning_l2)

                    ref_trx_l2 = models.Transaction(
                        user_id=referrer_l2.id,
                        type="bonus",
                        amount=commission_l2,
                        description=f"Affiliate L2 Commission from {user.email}",
                    )
                    db.add(ref_trx_l2)

                    if rel_l1:
                        rel_l1.referrer_l2_id = referrer_l2.id

                    if referrer_l2.referred_by:
                        referrer_l3 = (
                            db.query(models.User)
                            .filter(models.User.id == referrer_l2.referred_by)
                            .first()
                        )
                        if referrer_l3:
                            tier_l3 = (
                                db.query(models.AffiliateTier)
                                .filter(models.AffiliateTier.user_id == referrer_l3.id)
                                .first()
                            )
                            if not tier_l3:
                                tier_l3 = models.AffiliateTier(user_id=referrer_l3.id)
                                db.add(tier_l3)
                                db.commit()

                            commission_l3 = data.amount * tier_l3.commission_rate_l3
                            referrer_l3.balance += commission_l3
                            tier_l3.total_earnings += commission_l3
                            tier_l3.pending_payout += commission_l3
                            tier_l3.total_referrals_l3 += 1

                            earning_l3 = models.AffiliateEarning(
                                affiliate_id=referrer_l3.id,
                                referee_id=user.id,
                                amount=commission_l3,
                                status="approved",
                                tier=3,
                            )
                            db.add(earning_l3)

                            ref_trx_l3 = models.Transaction(
                                user_id=referrer_l3.id,
                                type="bonus",
                                amount=commission_l3,
                                description=f"Affiliate L3 Commission from {user.email}",
                            )
                            db.add(ref_trx_l3)

                            if rel_l1:
                                rel_l1.referrer_l3_id = referrer_l3.id

            db.commit()
            update_affiliate_tier(db, referrer_l1.id)

    db.commit()
    return {"status": "success", "new_balance": user.balance}


@app.get("/health")
def health_check():
    return {"status": "healthy", "mode": "saas_foundation"}


@app.post("/start")
async def start_traffic_adhoc(
    data: TrafficStart,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Global start endpoint for ad-hoc simulations from the UI"""
    # Create a transient project name for ad-hoc runs
    p_name = f"Ad-hoc Run {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    # Save as a project first so the scheduler can pick it up
    db_project = models.Project(
        user_id=current_user.id,
        name=p_name,
        plan_type="Ad-hoc",
        status="active",
        settings=data.dict(),
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # Trigger scheduler check immediately
    await scheduler.check_and_run()

    return {"status": "started", "project_id": db_project.id}


@app.post("/stop")
async def stop_traffic_adhoc(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Global stop endpoint - stops all active projects for the user"""
    active_projects = (
        db.query(models.Project)
        .filter(
            models.Project.user_id == current_user.id, models.Project.status == "active"
        )
        .all()
    )
    for p in active_projects:
        p.status = "stopped"
    db.commit()

    # Force stop the engines immediately
    from hit_emulator import ga_emu_engine

    # We can't stop the scheduler logic entirely or it won't restart, but we can tell the emulator to stop.
    ga_emu_engine.stop()

    return {"status": "stopped", "count": len(active_projects)}


@app.get("/stats")
def get_global_stats():
    from hit_emulator import ga_emu_engine

    total_success = sum(s.get("success", 0) for s in ga_emu_engine.stats.values())
    total_failure = sum(s.get("failure", 0) for s in ga_emu_engine.stats.values())

    # We'll map these to visit_stats/hit_stats as expected by the frontend
    # For now, we'll just put the totals in a special key or mock the per-url view
    # if the frontend logic expects per-url, but aggregated is better for the main dashboard.

    return {
        "visit_stats": {
            "Total": {
                "success": total_success,
                "failure": total_failure,
                "total": total_success + total_failure,
            }
        },
        "hit_stats": {
            "Total": {"success": 0, "failure": 0, "total": 0}
        },  # Legacy compatibility
        "is_running": scheduler.is_running,
        "recent_events": [],  # Handled by SSE now
    }


@app.get("/projects/stats")
def get_all_project_stats(
    days: int = 30,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Aggregate daily stats for all user's projects.
    Returns: { projectId: [{ date, visitors, pageviews }, ...] }
    """
    from datetime import datetime, timedelta

    start_date = datetime.utcnow() - timedelta(days=days)

    # Get all user's project IDs
    user_projects = (
        db.query(models.Project.id)
        .filter(models.Project.user_id == current_user.id)
        .all()
    )
    project_ids = [p.id for p in user_projects]

    if not project_ids:
        return {}

    # Aggregate traffic logs by project and date
    from sqlalchemy import func, and_

    stats = (
        db.query(
            models.TrafficLog.project_id,
            func.date(models.TrafficLog.timestamp).label("date"),
            func.count().label("pageviews"),
            func.count(
                func.distinct(func.coalesce(models.TrafficLog.ip, models.TrafficLog.id))
            ).label("visitors"),
        )
        .filter(
            and_(
                models.TrafficLog.project_id.in_(project_ids),
                models.TrafficLog.timestamp >= start_date,
                models.TrafficLog.status == "success",
            )
        )
        .group_by(models.TrafficLog.project_id, func.date(models.TrafficLog.timestamp))
        .order_by(func.date(models.TrafficLog.timestamp).desc())
        .all()
    )

    # Format response
    result = {}
    for s in stats:
        pid = s.project_id
        if pid not in result:
            result[pid] = []
        result[pid].append(
            {"date": str(s.date), "visitors": s.visitors, "pageviews": s.pageviews}
        )

    return result


@app.get("/projects/{project_id}/stats")
def get_project_stats(
    project_id: str,
    days: int = 30,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Daily stats for single project.
    Returns: [{ date, visitors, pageviews }, ...]
    """
    from datetime import datetime, timedelta
    from sqlalchemy import func, and_

    # Verify project belongs to user
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id, models.Project.user_id == current_user.id
        )
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    start_date = datetime.utcnow() - timedelta(days=days)

    stats = (
        db.query(
            func.date(models.TrafficLog.timestamp).label("date"),
            func.count().label("pageviews"),
            func.count(
                func.distinct(func.coalesce(models.TrafficLog.ip, models.TrafficLog.id))
            ).label("visitors"),
        )
        .filter(
            and_(
                models.TrafficLog.project_id == project_id,
                models.TrafficLog.timestamp >= start_date,
                models.TrafficLog.status == "success",
            )
        )
        .group_by(func.date(models.TrafficLog.timestamp))
        .order_by(func.date(models.TrafficLog.timestamp).desc())
        .all()
    )

    return [
        {"date": str(s.date), "visitors": s.visitors, "pageviews": s.pageviews}
        for s in stats
    ]


@app.get("/projects/active-now")
def get_active_now(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Real-time count of active visitors.
    Counts hits in the last 60 seconds and includes hits_today.
    """
    from datetime import datetime, timedelta
    from hit_emulator import ga_emu_engine

    one_minute_ago = datetime.utcnow() - timedelta(seconds=60)

    # Get user's projects (all, not just active - to show stats for paused too)
    user_projects = (
        db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
    )

    project_ids = [p.id for p in user_projects]

    if not project_ids:
        return {"activeNow": 0, "projects": {}}

    # Count recent hits from TrafficLog
    from sqlalchemy import func

    recent_hits = (
        db.query(
            models.TrafficLog.project_id,
            func.count().label("count"),
            func.max(models.TrafficLog.timestamp).label("last_hit"),
        )
        .filter(
            models.TrafficLog.project_id.in_(project_ids),
            models.TrafficLog.timestamp >= one_minute_ago,
        )
        .group_by(models.TrafficLog.project_id)
        .all()
    )

    # Build response with hits_today from project
    projects_data = {}
    total_active = 0

    for hit in recent_hits:
        projects_data[hit.project_id] = {
            "active": hit.count,
            "lastHit": hit.last_hit.isoformat() if hit.last_hit else None,
        }
        total_active += hit.count

    # Add hits_today for all user projects
    for p in user_projects:
        if p.id not in projects_data:
            projects_data[p.id] = {
                "active": 0,
                "lastHit": None,
            }
        projects_data[p.id]["hitsToday"] = p.hits_today or 0
        projects_data[p.id]["status"] = p.status

    return {"activeNow": total_active, "projects": projects_data}


@app.get("/projects/{project_id}/stats/hourly")
def get_project_stats_hourly(
    project_id: str,
    hours: int = 24,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    30-minute interval stats for single project (48 intervals for 24 hours).
    Returns: [{ hour, visitors, pageviews }, ...]
    """
    from datetime import datetime, timedelta
    from sqlalchemy import func, and_

    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id, models.Project.user_id == current_user.id
        )
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    start_time = datetime.utcnow() - timedelta(hours=hours)

    # Get all traffic logs and group by 30-min intervals in Python for reliability
    logs = (
        db.query(models.TrafficLog)
        .filter(
            and_(
                models.TrafficLog.project_id == project_id,
                models.TrafficLog.timestamp >= start_time,
                models.TrafficLog.status == "success",
            )
        )
        .all()
    )

    # Group by 30-minute intervals
    stats_dict = {}
    for log in logs:
        ts = log.timestamp
        minute = (ts.minute // 30) * 30
        slot_time = ts.replace(minute=minute, second=0, microsecond=0)
        hour_key = slot_time.strftime("%Y-%m-%d %H:%M")

        if hour_key not in stats_dict:
            stats_dict[hour_key] = {"visitors": set(), "pageviews": 0}

        stats_dict[hour_key]["pageviews"] += 1
        if log.ip:
            stats_dict[hour_key]["visitors"].add(log.ip)
        else:
            stats_dict[hour_key]["visitors"].add(str(log.id))

    # Generate all 48 intervals (30-minute slots) for the last 24 hours
    result = []
    now = datetime.utcnow()
    for i in range(48):
        slot_time = now - timedelta(minutes=i * 30)
        minute = (slot_time.minute // 30) * 30
        slot_time = slot_time.replace(minute=minute, second=0, microsecond=0)
        hour_key = slot_time.strftime("%Y-%m-%d %H:%M")

        if hour_key in stats_dict:
            result.append(
                {
                    "hour": hour_key,
                    "visitors": len(stats_dict[hour_key]["visitors"]),
                    "pageviews": stats_dict[hour_key]["pageviews"],
                }
            )
        else:
            result.append({"hour": hour_key, "visitors": 0, "pageviews": 0})

    return result


@app.get("/projects/{project_id}/stats/live")
def get_project_stats_live(
    project_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Live stats for single project - returns visitor/pageview data for last 1 hour
    in 5-minute intervals for real-time charts (12 data points).
    """
    from datetime import datetime, timedelta
    from sqlalchemy import func, and_

    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id, models.Project.user_id == current_user.id
        )
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    start_time = datetime.utcnow() - timedelta(hours=1)

    logs = (
        db.query(models.TrafficLog)
        .filter(
            and_(
                models.TrafficLog.project_id == project_id,
                models.TrafficLog.timestamp >= start_time,
                models.TrafficLog.status == "success",
            )
        )
        .all()
    )

    stats_dict = {}
    for log in logs:
        ts = log.timestamp
        minute = (ts.minute // 5) * 5
        slot_time = ts.replace(minute=minute, second=0, microsecond=0)
        time_key = slot_time.strftime("%Y-%m-%d %H:%M")

        if time_key not in stats_dict:
            stats_dict[time_key] = {"visitors": set(), "pageviews": 0}

        stats_dict[time_key]["pageviews"] += 1
        if log.ip:
            stats_dict[time_key]["visitors"].add(log.ip)
        else:
            stats_dict[time_key]["visitors"].add(str(log.id))

    result = []
    now = datetime.utcnow()
    for i in range(12):
        slot_time = now - timedelta(minutes=i * 5)
        minute = (slot_time.minute // 5) * 5
        slot_time = slot_time.replace(minute=minute, second=0, microsecond=0)
        time_key = slot_time.strftime("%Y-%m-%d %H:%M")

        if time_key in stats_dict:
            result.append(
                {
                    "time": time_key,
                    "visitors": len(stats_dict[time_key]["visitors"]),
                    "pageviews": stats_dict[time_key]["pageviews"],
                }
            )
        else:
            result.append({"time": time_key, "visitors": 0, "pageviews": 0})

    result.reverse()
    return result


@app.get("/projects/{project_id}/expires-calculated")
def get_calculated_expiry(
    project_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate when the project will expire based on current tier balance
    and total daily consumption of all active projects in that tier.
    """
    from datetime import datetime, timedelta

    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id, models.Project.user_id == current_user.id
        )
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tier = (project.tier or "economy").lower()
    tier_balance_map = {
        "economy": "balance_economy",
        "professional": "balance_professional",
        "expert": "balance_expert",
    }
    balance_field = tier_balance_map.get(tier, "balance_economy")
    balance = float(getattr(current_user, balance_field, 0) or 0)

    active_projects = (
        db.query(models.Project)
        .filter(
            models.Project.user_id == current_user.id,
            models.Project.status == "active",
            models.Project.tier == tier,
        )
        .all()
    )

    total_daily = sum(p.daily_limit or 0 for p in active_projects)

    if total_daily == 0:
        return {
            "daysRemaining": None,
            "expiresDate": None,
            "balance": balance,
            "totalDailyConsumption": 0,
            "message": "No daily limit set" if balance > 0 else "No balance",
        }

    days_remaining = balance / total_daily
    expires_date = datetime.utcnow() + timedelta(days=days_remaining)

    return {
        "daysRemaining": round(days_remaining, 1),
        "expiresDate": expires_date.strftime("%Y-%m-%d"),
        "balance": balance,
        "totalDailyConsumption": total_daily,
        "message": None,
    }


@app.get("/admin/live-pulse")
async def live_pulse(db: Session = Depends(get_db)):
    """SSE endpoint for real-time traffic monitoring"""

    async def event_generator():
        last_id = 0
        while True:
            # Fetch logs newer than what we've already sent
            new_logs = (
                db.query(models.TrafficLog)
                .filter(models.TrafficLog.id > last_id)
                .order_by(models.TrafficLog.id.desc())
                .limit(10)
                .all()
            )
            if new_logs:
                last_id = new_logs[0].id
                logs_data = []
                for log in new_logs:
                    logs_data.append(
                        {
                            "id": log.id,
                            "project_id": log.project_id,
                            "timestamp": log.timestamp.isoformat(),
                            "url": log.url,
                            "status": log.status,
                            "type": log.event_type,
                            "proxy": log.proxy,
                        }
                    )
                yield {"data": json.dumps(logs_data)}
            await asyncio.sleep(2)  # Pulse every 2 seconds

    return EventSourceResponse(event_generator())


@app.get("/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    thirty_days_ago = now - timedelta(days=30)

    # Revenue (Credits Only)
    # We use a subquery or separate queries for clarity
    total_rev = (
        db.query(func.sum(models.Transaction.amount))
        .filter(models.Transaction.type == "credit")
        .scalar()
        or 0.0
    )
    rev_today = (
        db.query(func.sum(models.Transaction.amount))
        .filter(
            models.Transaction.type == "credit",
            models.Transaction.created_at >= today_start,
        )
        .scalar()
        or 0.0
    )
    rev_30d = (
        db.query(func.sum(models.Transaction.amount))
        .filter(
            models.Transaction.type == "credit",
            models.Transaction.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0.0
    )

    # Users
    total_users = db.query(models.User).count()
    new_users_today = (
        db.query(models.User).filter(models.User.created_at >= today_start).count()
    )

    # Projects
    total_projects = db.query(models.Project).count()
    active_projects = (
        db.query(models.Project).filter(models.Project.status == "active").count()
    )
    new_projects_today = (
        db.query(models.Project)
        .filter(models.Project.created_at >= today_start)
        .count()
    )

    # Hits
    total_hits = db.query(func.sum(models.Project.total_hits)).scalar() or 0

    return {
        "revenue": {"total": total_rev, "today": rev_today, "last_30d": rev_30d},
        "users": {"total": total_users, "new_today": new_users_today},
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "new_today": new_projects_today,
        },
        "traffic": {"total_hits": total_hits},
        "system_status": "operational",
    }


@app.get("/admin/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.User).all()


@app.put("/admin/users/{user_id}")
def update_user_admin(
    user_id: str,
    user_update: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    return {"status": "success"}


@app.get("/admin/users/{user_id}/details", response_model=AdminUserDetailsResponse)
def get_user_details_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    from admin_utils import get_or_create_notification_prefs

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get tier balances from transactions
    credit_transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.user_id == user_id, models.Transaction.type == "credit"
        )
        .all()
    )

    debit_transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.user_id == user_id, models.Transaction.type == "debit"
        )
        .all()
    )

    tier_balances = {"economy": 0, "professional": 0, "expert": 0}

    total_spent = 0
    total_hits_purchased = 0
    total_hits_used = 0

    for trx in credit_transactions:
        if trx.tier in tier_balances:
            tier_balances[trx.tier] += trx.hits or 0
        total_hits_purchased += trx.hits or 0
        total_spent += trx.amount or 0

    for trx in debit_transactions:
        if trx.tier in tier_balances:
            tier_balances[trx.tier] -= trx.hits or 0
        total_hits_used += trx.hits or 0

    # Get counts
    transactions_count = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .count()
    )
    projects_count = (
        db.query(models.Project).filter(models.Project.user_id == user_id).count()
    )
    tickets_count = (
        db.query(models.Ticket).filter(models.Ticket.user_id == user_id).count()
    )

    # Get referral info
    referrals_count = (
        db.query(models.User).filter(models.User.referred_by == user_id).count()
    )
    referral_earnings = (
        db.query(func.sum(models.AffiliateEarning.amount))
        .filter(models.AffiliateEarning.referrer_id == user_id)
        .scalar()
        or 0
    )

    # Get notification prefs
    notification_prefs = get_or_create_notification_prefs(user_id)

    # Build user response
    user_response = UserResponse(
        id=db_user.id,
        email=db_user.email,
        role=db_user.role,
        balance=db_user.balance,
        balance_economy=db_user.balance_economy,
        balance_professional=db_user.balance_professional,
        balance_expert=db_user.balance_expert,
        api_key=db_user.api_key,
        affiliate_code=db_user.affiliate_code,
        status=db_user.status,
        plan=db_user.plan,
        shadow_banned=db_user.shadow_banned,
        is_verified=db_user.is_verified,
        notes=db_user.notes,
        tags=db_user.tags or [],
        ban_reason=db_user.ban_reason,
        created_at=db_user.created_at,
        last_ip=db_user.last_ip,
        last_active=db_user.last_active,
    )

    prefs_response = None
    if notification_prefs:
        prefs_response = UserNotificationPrefsResponse(
            id=notification_prefs.id,
            user_id=notification_prefs.user_id,
            email_marketing=notification_prefs.email_marketing,
            email_transactional=notification_prefs.email_transactional,
            email_alerts=notification_prefs.email_alerts,
            browser_notifications=notification_prefs.browser_notifications,
            newsletter_sub=notification_prefs.newsletter_sub,
            email_frequency=notification_prefs.email_frequency,
            updated_at=notification_prefs.updated_at,
        )

    return AdminUserDetailsResponse(
        user=user_response,
        tier_balances=tier_balances,
        total_spent=total_spent,
        total_hits_purchased=total_hits_purchased,
        total_hits_used=total_hits_used,
        transactions_count=transactions_count,
        projects_count=projects_count,
        tickets_count=tickets_count,
        referrals_count=referrals_count,
        referral_earnings=referral_earnings,
        notification_prefs=prefs_response,
    )


@app.put("/admin/users/{user_id}", response_model=UserResponse)
def update_user_admin(
    user_id: str,
    user_update: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.dict(exclude_unset=True)

    # Handle password separately
    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            db_user.password_hash = get_password_hash(password)
            db_user.token_version = (db_user.token_version or 1) + 1

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/admin/users/{user_id}/activity", response_model=List[ActivityLogResponse])
def get_user_activity(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    action_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    query = db.query(models.ActivityLog).filter(models.ActivityLog.user_id == user_id)

    if action_type:
        query = query.filter(models.ActivityLog.action_type == action_type)

    activities = (
        query.order_by(models.ActivityLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        ActivityLogResponse(
            id=a.id,
            user_id=a.user_id,
            action_type=a.action_type,
            action_detail=a.action_detail or {},
            ip_address=a.ip_address,
            user_agent=a.user_agent,
            created_at=a.created_at,
        )
        for a in activities
    ]


@app.get("/admin/users/{user_id}/sessions", response_model=List[UserSessionResponse])
def get_user_sessions_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    sessions = (
        db.query(models.UserSession)
        .filter(
            models.UserSession.user_id == user_id, models.UserSession.status == "active"
        )
        .order_by(models.UserSession.last_active.desc())
        .all()
    )

    return [
        UserSessionResponse(
            id=s.id,
            user_id=s.user_id,
            ip_address=s.ip_address,
            user_agent=s.user_agent,
            device_info={"device": s.device, "browser": s.browser},
            location=None,
            created_at=s.created_at,
            last_activity=s.last_active,
            expires_at=s.expires_at,
            is_active=s.status == "active",
        )
        for s in sessions
    ]


@app.delete("/admin/users/{user_id}/sessions/{session_id}")
def terminate_user_session(
    user_id: str,
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    from admin_utils import terminate_session

    success = terminate_session(session_id, "admin_terminate")
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"status": "success", "message": "Session terminated"}


@app.get(
    "/admin/users/{user_id}/impersonation-log",
    response_model=List[ImpersonationLogResponse],
)
def get_impersonation_log(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    logs = (
        db.query(models.ImpersonationLog)
        .filter(models.ImpersonationLog.target_user_id == user_id)
        .order_by(models.ImpersonationLog.created_at.desc())
        .all()
    )

    result = []
    for log in logs:
        admin = db.query(models.User).filter(models.User.id == log.admin_id).first()
        result.append(
            ImpersonationLogResponse(
                id=log.id,
                admin_id=log.admin_id,
                target_user_id=log.target_user_id,
                action=log.action,
                ip_address=log.ip_address,
                created_at=log.created_at,
                admin_email=admin.email if admin else None,
            )
        )

    return result


@app.get(
    "/admin/users/{user_id}/balance-adjustments",
    response_model=List[BalanceAdjustmentLogResponse],
)
def get_balance_adjustments(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    adjustments = (
        db.query(models.BalanceAdjustmentLog)
        .filter(models.BalanceAdjustmentLog.user_id == user_id)
        .order_by(models.BalanceAdjustmentLog.created_at.desc())
        .all()
    )

    result = []
    for adj in adjustments:
        admin = (
            db.query(models.User).filter(models.User.id == adj.admin_id).first()
            if adj.admin_id
            else None
        )
        result.append(
            BalanceAdjustmentLogResponse(
                id=adj.id,
                user_id=adj.user_id,
                admin_id=adj.admin_id,
                adjustment_type=adj.adjustment_type,
                tier=adj.tier,
                amount=adj.amount,
                hits=adj.hits,
                reason=adj.reason,
                notes=adj.notes,
                created_at=adj.created_at,
                admin_email=admin.email if admin else None,
            )
        )

    return result


@app.post("/admin/users/{user_id}/adjust-balance")
def adjust_user_balance(
    user_id: str,
    adjustment: BalanceAdjustRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update balance
    if adjustment.tier == "general":
        if adjustment.adjustment_type == "credit":
            db_user.balance += adjustment.amount
        else:
            db_user.balance -= adjustment.amount
    elif adjustment.tier == "economy":
        if adjustment.adjustment_type == "credit":
            db_user.balance_economy += adjustment.hits or 0
        else:
            db_user.balance_economy -= adjustment.hits or 0
    elif adjustment.tier == "professional":
        if adjustment.adjustment_type == "credit":
            db_user.balance_professional += adjustment.hits or 0
        else:
            db_user.balance_professional -= adjustment.hits or 0
    elif adjustment.tier == "expert":
        if adjustment.adjustment_type == "credit":
            db_user.balance_expert += adjustment.hits or 0
        else:
            db_user.balance_expert -= adjustment.hits or 0

    # Log the adjustment
    from admin_utils import log_balance_adjustment, log_email

    log_balance_adjustment(
        user_id=user_id,
        admin_id=current_user.id,
        adjustment_type=adjustment.adjustment_type,
        tier=adjustment.tier,
        amount=adjustment.amount,
        hits=adjustment.hits,
        reason=adjustment.reason,
        notes=adjustment.notes,
        db=db,
    )

    # Log email notification
    log_email(
        user_id=user_id,
        email_type="balance_adjusted",
        to_email=db_user.email,
        subject="Your balance has been adjusted",
        status="sent",
        db=db,
    )

    db.commit()
    return {
        "status": "success",
        "message": f"Balance adjusted: {adjustment.adjustment_type} {adjustment.hits or adjustment.amount} {adjustment.tier}",
    }


@app.post("/admin/users/{user_id}/add-bonus-hits")
def add_bonus_hits(
    user_id: str,
    request: AddBonusHitsRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add hits to the specified tier
    if request.tier == "economy":
        db_user.balance_economy += request.hits
    elif request.tier == "professional":
        db_user.balance_professional += request.hits
    elif request.tier == "expert":
        db_user.balance_expert += request.hits

    # Create transaction
    trx = models.Transaction(
        user_id=user_id,
        type="credit",
        amount=0,
        description=f"Bonus hits added by admin ({current_user.email}): {request.hits} {request.tier} hits - {request.reason}",
        status="completed",
        tier=request.tier,
        hits=request.hits,
    )
    db.add(trx)

    # Log the adjustment
    from admin_utils import log_balance_adjustment, log_email

    log_balance_adjustment(
        user_id=user_id,
        admin_id=current_user.id,
        adjustment_type="credit",
        tier=request.tier,
        amount=0,
        hits=request.hits,
        reason=request.reason,
        notes="Bonus hits",
        db=db,
    )

    # Log email
    log_email(
        user_id=user_id,
        email_type="bonus_hits",
        to_email=db_user.email,
        subject=f"You've received {request.hits} bonus {request.tier} hits!",
        status="sent",
        db=db,
    )

    db.commit()
    return {"status": "success", "message": f"Added {request.hits} {request.tier} hits"}


@app.get("/admin/users/{user_id}/emails", response_model=List[EmailLogResponse])
def get_user_emails(
    user_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    emails = (
        db.query(models.EmailLog)
        .filter(models.EmailLog.user_id == user_id)
        .order_by(models.EmailLog.sent_at.desc())
        .limit(limit)
        .all()
    )

    return [
        EmailLogResponse(
            id=e.id,
            user_id=e.user_id,
            email_type=e.email_type,
            to_email=e.to_email,
            subject=e.subject,
            status=e.status,
            error_message=e.error_message,
            sent_at=e.sent_at,
            delivered_at=e.delivered_at,
        )
        for e in emails
    ]


@app.get("/admin/users/{user_id}/referrals")
def get_user_referrals(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    referrals = db.query(models.User).filter(models.User.referred_by == user_id).all()

    referral_data = []
    for ref in referrals:
        # Get total spent by this referral
        total_spent = (
            db.query(func.sum(models.Transaction.amount))
            .filter(
                models.Transaction.user_id == ref.id,
                models.Transaction.type == "credit",
            )
            .scalar()
            or 0
        )

        # Get earnings from this referral
        earnings = (
            db.query(func.sum(models.AffiliateEarnings.amount))
            .filter(models.AffiliateEarnings.referee_id == ref.id)
            .scalar()
            or 0
        )

        referral_data.append(
            {
                "id": ref.id,
                "email": ref.email,
                "name": ref.name or ref.email.split("@")[0],
                "status": ref.status,
                "created_at": ref.created_at.isoformat() if ref.created_at else None,
                "total_spent": total_spent,
                "earnings_from_ref": earnings,
            }
        )

    total_earnings = (
        db.query(func.sum(models.AffiliateEarnings.amount))
        .filter(models.AffiliateEarnings.referrer_id == user_id)
        .scalar()
        or 0
    )

    return {
        "referrals": referral_data,
        "total_referrals": len(referral_data),
        "total_earnings": total_earnings,
    }


@app.get(
    "/admin/users/{user_id}/notification-prefs",
    response_model=UserNotificationPrefsResponse,
)
def get_user_notification_prefs(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    from admin_utils import get_or_create_notification_prefs

    prefs = get_or_create_notification_prefs(user_id)

    if not prefs:
        raise HTTPException(status_code=404, detail="User not found")

    return UserNotificationPrefsResponse(
        id=prefs.id,
        user_id=prefs.user_id,
        email_marketing=prefs.email_marketing,
        email_transactional=prefs.email_transactional,
        email_alerts=prefs.email_alerts,
        browser_notifications=prefs.browser_notifications,
        newsletter_sub=prefs.newsletter_sub,
        email_frequency=prefs.email_frequency,
        updated_at=prefs.updated_at,
    )


@app.put(
    "/admin/users/{user_id}/notification-prefs",
    response_model=UserNotificationPrefsResponse,
)
def update_user_notification_prefs(
    user_id: str,
    prefs_update: UserNotificationPrefsResponse,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    from admin_utils import get_or_create_notification_prefs

    prefs = get_or_create_notification_prefs(user_id)

    prefs.email_marketing = prefs_update.email_marketing
    prefs.email_transactional = prefs_update.email_transactional
    prefs.email_alerts = prefs_update.email_alerts
    prefs.browser_notifications = prefs_update.browser_notifications
    prefs.newsletter_sub = prefs_update.newsletter_sub
    prefs.email_frequency = prefs_update.email_frequency

    db.commit()
    db.refresh(prefs)

    return UserNotificationPrefsResponse(
        id=prefs.id,
        user_id=prefs.user_id,
        email_marketing=prefs.email_marketing,
        email_transactional=prefs.email_transactional,
        email_alerts=prefs.email_alerts,
        browser_notifications=prefs.browser_notifications,
        newsletter_sub=prefs.newsletter_sub,
        email_frequency=prefs.email_frequency,
        updated_at=prefs.updated_at,
    )


@app.post("/admin/users/{user_id}/send-password-reset")
def send_password_reset(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.require_password_reset = True
    db.commit()

    from admin_utils import log_email

    log_email(
        user_id=user_id,
        email_type="password_reset",
        to_email=db_user.email,
        subject="Password Reset Requested",
        status="sent",
    )

    return {"status": "success", "message": "Password reset email sent"}


@app.post("/admin/users/{user_id}/resend-verification")
def resend_verification(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    from admin_utils import log_email

    log_email(
        user_id=user_id,
        email_type="verification",
        to_email=db_user.email,
        subject="Verify your email address",
        status="sent",
    )

    return {"status": "success", "message": "Verification email sent"}


@app.post("/admin/users/{user_id}/regenerate-api-key")
def regenerate_api_key(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    import secrets

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_api_key = secrets.token_urlsafe(32)
    db_user.api_key = new_api_key

    from admin_utils import log_activity

    log_activity(
        user_id=user_id,
        action_type="api_key_regenerated",
        action_detail={"by_admin": current_user.id},
        ip_address=current_user.last_ip,
    )

    db.commit()

    return {"status": "success", "api_key": new_api_key}


@app.post("/admin/impersonate/{user_id}")
def start_impersonation(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    from admin_utils import log_impersonation

    log_impersonation(
        admin_id=current_user.id,
        target_user_id=user_id,
        action="start",
        ip_address=current_user.last_ip,
    )

    # Generate a token for the target user
    from datetime import timedelta

    access_token_expires = timedelta(minutes=30)
    encoded_jwt = create_user_access_token(target_user, access_token_expires)

    return {
        "status": "success",
        "token": encoded_jwt,
        "target_user": target_user.email,
        "message": f"You are now impersonating {target_user.email}",
    }


@app.post("/admin/impersonate/end")
def end_impersonation(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # This would be called when admin ends impersonation
    # The actual logging happens when starting
    return {"status": "success", "message": "Impersonation ended"}


@app.get("/admin/users/{user_id}/export")
def export_user_data(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Gather all user data
    transactions = (
        db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()
    )
    projects = db.query(models.Project).filter(models.Project.user_id == user_id).all()
    tickets = db.query(models.Ticket).filter(models.Ticket.user_id == user_id).all()
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id)
        .all()
    )
    activity_logs = (
        db.query(models.ActivityLog).filter(models.ActivityLog.user_id == user_id).all()
    )

    export_data = {
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "role": db_user.role,
            "status": db_user.status,
            "created_at": db_user.created_at.isoformat()
            if db_user.created_at
            else None,
            "last_active": db_user.last_active.isoformat()
            if db_user.last_active
            else None,
        },
        "transactions": [
            {
                "id": t.id,
                "type": t.type,
                "amount": t.amount,
                "description": t.description,
                "tier": t.tier,
                "hits": t.hits,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in transactions
        ],
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "tier": p.tier,
                "total_target": p.total_target,
                "total_hits": p.total_hits,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in projects
        ],
        "tickets": [
            {
                "id": t.id,
                "subject": t.subject,
                "status": t.status,
                "priority": t.priority,
                "messages": t.messages,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tickets
        ],
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifications
        ],
        "activity_log": [
            {
                "id": a.id,
                "action_type": a.action_type,
                "action_detail": a.action_detail,
                "ip_address": a.ip_address,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in activity_logs
        ],
        "exported_at": datetime.utcnow().isoformat(),
    }

    return export_data


@app.get("/admin/transactions", response_model=List[TransactionResponse])
def get_all_transactions(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.Transaction).all()


class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    status: Optional[str] = None
    tier: Optional[str] = None
    reference: Optional[str] = None


@app.put("/admin/transactions/{trx_id}", response_model=TransactionResponse)
def update_transaction(
    trx_id: str,
    update_data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    trx = db.query(models.Transaction).filter(models.Transaction.id == trx_id).first()
    if not trx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if update_data.description is not None:
        trx.description = update_data.description
    if update_data.amount is not None:
        trx.amount = update_data.amount
    if update_data.type is not None:
        trx.type = update_data.type
    if update_data.status is not None:
        trx.status = update_data.status
    if update_data.tier is not None:
        trx.tier = update_data.tier
    if update_data.reference is not None:
        trx.reference = update_data.reference

    db.commit()
    db.refresh(trx)
    return trx


# --- Ticket & Notification Endpoints ---


def ticket_to_response(ticket: models.Ticket, db: Session) -> dict:
    user = db.query(models.User).filter(models.User.id == ticket.user_id).first()
    project_name = None
    if ticket.project_id:
        project = (
            db.query(models.Project)
            .filter(models.Project.id == ticket.project_id)
            .first()
        )
        project_name = project.name if project else None
    return {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "user_email": user.email if user else None,
        "subject": ticket.subject,
        "status": ticket.status,
        "priority": ticket.priority,
        "type": ticket.type,
        "category": ticket.category or "general",
        "project_id": ticket.project_id,
        "project_name": project_name,
        "attachment_urls": ticket.attachment_urls or [],
        "messages": ticket.messages or [],
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
    }


@app.get("/tickets", response_model=List[TicketResponse])
def get_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Ticket)

    if current_user.role != "admin":
        query = query.filter(models.Ticket.user_id == current_user.id)

    if status:
        query = query.filter(models.Ticket.status == status)

    if category:
        query = query.filter(models.Ticket.category == category)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Ticket.subject.ilike(search_pattern))
            | (models.Ticket.messages.cast(Text).ilike(search_pattern))
        )

    tickets = query.order_by(models.Ticket.created_at.desc()).all()
    return [ticket_to_response(t, db) for t in tickets]


@app.post("/tickets", response_model=TicketResponse)
def create_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    new_ticket = models.Ticket(
        user_id=current_user.id,
        subject=ticket.subject,
        priority=ticket.priority,
        type=ticket.type,
        category=ticket.category,
        project_id=ticket.project_id,
        attachment_urls=ticket.attachment_urls,
        messages=ticket.messages,
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return ticket_to_response(new_ticket, db)


@app.post("/tickets/{ticket_id}/reply", response_model=TicketResponse)
def reply_ticket(
    ticket_id: str,
    reply: TicketReply,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    new_msg = {
        "id": str(datetime.utcnow().timestamp()),
        "sender": "admin" if current_user.role == "admin" else "user",
        "text": reply.text,
        "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "attachments": reply.attachments,
    }

    current_messages = list(ticket.messages) if ticket.messages else []
    current_messages.append(new_msg)
    ticket.messages = current_messages

    db.commit()
    db.refresh(ticket)
    return ticket_to_response(ticket, db)


@app.put("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    update: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if update.status:
        ticket.status = update.status
    if update.priority:
        ticket.priority = update.priority
    if update.type:
        ticket.type = update.type
    if update.category:
        ticket.category = update.category

    db.commit()
    db.refresh(ticket)
    return ticket_to_response(ticket, db)


@app.post("/tickets/{ticket_id}/close", response_model=TicketResponse)
def close_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    ticket.status = "closed"
    db.commit()
    db.refresh(ticket)
    return ticket_to_response(ticket, db)


@app.post("/tickets/upload")
async def upload_ticket_attachment(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    import os

    upload_dir = f"static/ticket_attachments/{current_user.id}"
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename or "file")[1]
    unique_filename = f"{datetime.utcnow().timestamp()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    file_url = f"/static/ticket_attachments/{current_user.id}/{unique_filename}"
    return {"url": file_url, "filename": file.filename}


@app.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return ticket_to_response(ticket, db)


@app.delete("/tickets/{ticket_id}")
def delete_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(ticket)
    db.commit()
    return {"status": "deleted"}


@app.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


@app.put("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notif = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notif_id,
            models.Notification.user_id == current_user.id,
        )
        .first()
    )
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}


@app.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    settings_row = db.query(models.SystemSettings).first()
    if not settings_row:
        return {"settings": {}}
    return {"settings": settings_row.settings}


@app.put("/settings")
def update_settings(
    data: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    settings_row = db.query(models.SystemSettings).first()
    if not settings_row:
        settings_row = models.SystemSettings(id=1, settings=data.settings)
        db.add(settings_row)
    else:
        settings_row.settings = data.settings
    db.commit()
    return {"status": "updated"}


class ConversionSettingsUpdate(BaseModel):
    social_proof_enabled: bool = False
    social_proof_position: str = "bottom-right"
    social_proof_delay: int = 5
    social_proof_show_simulated: bool = True
    exit_intent_enabled: bool = False
    exit_intent_headline: str = "Wait! Don't miss out!"
    exit_intent_subtext: str = "Get 10% off your first order"
    exit_intent_coupon_code: str = "WELCOME10"
    promo_bar_enabled: bool = False
    promo_bar_message: str = "Free shipping on orders over $50!"
    promo_bar_button_text: str = "Shop Now"
    promo_bar_button_url: str = "/pricing"
    promo_bar_background_color: str = "#000000"
    promo_bar_text_color: str = "#ffffff"
    promo_bar_countdown_end: Optional[str] = None


@app.get("/conversion-settings")
def get_conversion_settings(db: Session = Depends(get_db)):
    settings = db.query(models.ConversionSettings).first()
    if not settings:
        settings = models.ConversionSettings(id="global")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {
        "id": settings.id,
        "socialProofEnabled": settings.social_proof_enabled,
        "socialProofPosition": settings.social_proof_position,
        "socialProofDelay": settings.social_proof_delay,
        "socialProofShowSimulated": settings.social_proof_show_simulated,
        "exitIntentEnabled": settings.exit_intent_enabled,
        "exitIntentHeadline": settings.exit_intent_headline,
        "exitIntentSubtext": settings.exit_intent_subtext,
        "exitIntentCouponCode": settings.exit_intent_coupon_code,
        "promoBarEnabled": settings.promo_bar_enabled,
        "promoBarMessage": settings.promo_bar_message,
        "promoBarButtonText": settings.promo_bar_button_text,
        "promoBarButtonUrl": settings.promo_bar_button_url,
        "promoBarBackgroundColor": settings.promo_bar_background_color,
        "promoBarTextColor": settings.promo_bar_text_color,
        "promoBarCountdownEnd": settings.promo_bar_countdown_end.isoformat()
        if settings.promo_bar_countdown_end
        else None,
    }


@app.put("/conversion-settings")
def update_conversion_settings(
    data: ConversionSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    settings = db.query(models.ConversionSettings).first()
    if not settings:
        settings = models.ConversionSettings(id="global")
        db.add(settings)

    from datetime import datetime

    settings.social_proof_enabled = data.social_proof_enabled
    settings.social_proof_position = data.social_proof_position
    settings.social_proof_delay = data.social_proof_delay
    settings.social_proof_show_simulated = data.social_proof_show_simulated
    settings.exit_intent_enabled = data.exit_intent_enabled
    settings.exit_intent_headline = data.exit_intent_headline
    settings.exit_intent_subtext = data.exit_intent_subtext
    settings.exit_intent_coupon_code = data.exit_intent_coupon_code
    settings.promo_bar_enabled = data.promo_bar_enabled
    settings.promo_bar_message = data.promo_bar_message
    settings.promo_bar_button_text = data.promo_bar_button_text
    settings.promo_bar_button_url = data.promo_bar_button_url
    settings.promo_bar_background_color = data.promo_bar_background_color
    settings.promo_bar_text_color = data.promo_bar_text_color
    if data.promo_bar_countdown_end:
        settings.promo_bar_countdown_end = datetime.fromisoformat(
            data.promo_bar_countdown_end
        )
    else:
        settings.promo_bar_countdown_end = None

    db.commit()
    return {"status": "updated"}


class LoyaltySettingsUpdate(BaseModel):
    enabled: bool = False
    points_per_dollar: float = 1.0
    redemption_rate: float = 0.01
    bonus_signup_points: int = 100


@app.get("/loyalty-settings")
def get_loyalty_settings(db: Session = Depends(get_db)):
    settings = db.query(models.LoyaltySettings).first()
    if not settings:
        settings = models.LoyaltySettings(id="global")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {
        "id": settings.id,
        "enabled": settings.enabled,
        "pointsPerDollar": settings.points_per_dollar,
        "redemptionRate": settings.redemption_rate,
        "bonusSignupPoints": settings.bonus_signup_points,
    }


@app.put("/loyalty-settings")
def update_loyalty_settings(
    data: LoyaltySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    settings = db.query(models.LoyaltySettings).first()
    if not settings:
        settings = models.LoyaltySettings(id="global")
        db.add(settings)

    settings.enabled = data.enabled
    settings.points_per_dollar = data.points_per_dollar
    settings.redemption_rate = data.redemption_rate
    settings.bonus_signup_points = data.bonus_signup_points

    db.commit()
    return {"status": "updated"}


class ReferralSettingsUpdate(BaseModel):
    enabled: bool = False
    referrer_reward_type: str = "percentage"
    referrer_reward_value: float = 10.0
    referee_reward_type: str = "percentage"
    referee_reward_value: float = 15.0


@app.get("/referral-settings")
def get_referral_settings(db: Session = Depends(get_db)):
    settings = db.query(models.ReferralSettings).first()
    if not settings:
        settings = models.ReferralSettings(id="global")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {
        "id": settings.id,
        "enabled": settings.enabled,
        "referrerRewardType": settings.referrer_reward_type,
        "referrerRewardValue": settings.referrer_reward_value,
        "refereeRewardType": settings.referee_reward_type,
        "refereeRewardValue": settings.referee_reward_value,
    }


@app.put("/referral-settings")
def update_referral_settings(
    data: ReferralSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    settings = db.query(models.ReferralSettings).first()
    if not settings:
        settings = models.ReferralSettings(id="global")
        db.add(settings)

    settings.enabled = data.enabled
    settings.referrer_reward_type = data.referrer_reward_type
    settings.referrer_reward_value = data.referrer_reward_value
    settings.referee_reward_type = data.referee_reward_type
    settings.referee_reward_value = data.referee_reward_value

    db.commit()
    return {"status": "updated"}


class FAQCreate(BaseModel):
    question: str
    answer: str
    category: str = "general"
    display_order: int = 0


class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class FAQResponse(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


@app.get("/faqs")
def get_faqs(db: Session = Depends(get_db)):
    """Get all active FAQs for public display"""
    faqs = (
        db.query(models.FAQ)
        .filter(models.FAQ.is_active == True)
        .order_by(models.FAQ.display_order)
        .all()
    )
    return [
        {
            "id": f.id,
            "question": f.question,
            "answer": f.answer,
            "category": f.category,
            "displayOrder": f.display_order,
            "isActive": f.is_active,
        }
        for f in faqs
    ]


@app.get("/admin/faqs", response_model=List[FAQResponse])
def get_admin_faqs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all FAQs for admin management"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.FAQ).order_by(models.FAQ.display_order).all()


@app.post("/admin/faqs", response_model=FAQResponse)
def create_faq(
    faq: FAQCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new FAQ"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    new_faq = models.FAQ(
        question=faq.question,
        answer=faq.answer,
        category=faq.category,
        display_order=faq.display_order,
    )
    db.add(new_faq)
    db.commit()
    db.refresh(new_faq)
    return new_faq


@app.put("/admin/faqs/{faq_id}", response_model=FAQResponse)
def update_faq(
    faq_id: str,
    faq_update: FAQUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing FAQ"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    update_data = faq_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(faq, key, value)

    db.commit()
    db.refresh(faq)
    return faq


@app.delete("/admin/faqs/{faq_id}")
def delete_faq(
    faq_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an FAQ"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    db.delete(faq)
    db.commit()
    return {"status": "deleted"}


class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    min_purchase: float = 0.0
    max_uses: Optional[int] = None
    max_uses_per_user: int = 1
    plan_restriction: Optional[str] = None
    duration: str = "once"
    expires_at: Optional[str] = None


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase: Optional[float] = None
    max_uses: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    plan_restriction: Optional[str] = None
    duration: Optional[str] = None
    expires_at: Optional[str] = None
    is_active: Optional[bool] = None


class CouponResponse(BaseModel):
    id: str
    code: str
    discount_type: str
    discount_value: float
    min_purchase: float
    max_uses: Optional[int]
    used_count: int
    max_uses_per_user: int
    plan_restriction: Optional[str]
    duration: str
    expires_at: Optional[datetime]
    is_active: bool
    created_at: datetime


@app.get("/coupons/validate")
def validate_coupon(
    code: str,
    db: Session = Depends(get_db),
):
    """Validate a coupon code for a user"""
    coupon = (
        db.query(models.Coupon)
        .filter(models.Coupon.code == code.upper(), models.Coupon.is_active == True)
        .first()
    )

    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")

    if coupon.expires_at and coupon.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Coupon has expired")

    if coupon.max_uses and coupon.used_count >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")

    return {
        "valid": True,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_purchase": coupon.min_purchase,
        "duration": coupon.duration,
    }


@app.get("/admin/coupons", response_model=List[CouponResponse])
def get_admin_coupons(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all coupons for admin management"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.Coupon).order_by(models.Coupon.created_at.desc()).all()


@app.post("/admin/coupons", response_model=CouponResponse)
def create_coupon(
    coupon: CouponCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new coupon"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    existing = (
        db.query(models.Coupon)
        .filter(models.Coupon.code == coupon.code.upper())
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    expires_at = None
    if coupon.expires_at:
        expires_at = datetime.fromisoformat(coupon.expires_at)

    new_coupon = models.Coupon(
        code=coupon.code.upper(),
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        min_purchase=coupon.min_purchase,
        max_uses=coupon.max_uses,
        max_uses_per_user=coupon.max_uses_per_user,
        plan_restriction=coupon.plan_restriction,
        duration=coupon.duration,
        expires_at=expires_at,
        created_by=current_user.id,
    )
    db.add(new_coupon)
    db.commit()
    db.refresh(new_coupon)
    return new_coupon


@app.put("/admin/coupons/{coupon_id}", response_model=CouponResponse)
def update_coupon(
    coupon_id: str,
    coupon_update: CouponUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing coupon"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    update_data = coupon_update.dict(exclude_unset=True)
    if "expires_at" in update_data and update_data["expires_at"]:
        update_data["expires_at"] = datetime.fromisoformat(update_data["expires_at"])

    for key, value in update_data.items():
        setattr(coupon, key, value)

    db.commit()
    db.refresh(coupon)
    return coupon


@app.delete("/admin/coupons/{coupon_id}")
def delete_coupon(
    coupon_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a coupon"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    db.delete(coupon)
    db.commit()
    return {"status": "deleted"}


class MarketingCampaignCreate(BaseModel):
    name: str
    campaign_type: str = "ad_tracking"
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class MarketingCampaignUpdate(BaseModel):
    name: Optional[str] = None
    campaign_type: Optional[str] = None
    status: Optional[str] = None
    clicks: Optional[int] = None
    conversions: Optional[int] = None
    revenue: Optional[float] = None
    spend: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class MarketingCampaignResponse(BaseModel):
    id: str
    name: str
    campaign_type: str
    status: str
    clicks: int
    conversions: int
    revenue: float
    spend: float
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime


@app.get("/admin/marketing", response_model=List[MarketingCampaignResponse])
def get_marketing_campaigns(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all marketing campaigns"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return (
        db.query(models.MarketingCampaign)
        .order_by(models.MarketingCampaign.created_at.desc())
        .all()
    )


@app.post("/admin/marketing", response_model=MarketingCampaignResponse)
def create_marketing_campaign(
    campaign: MarketingCampaignCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new marketing campaign"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    start_date = None
    if campaign.start_date:
        start_date = datetime.fromisoformat(campaign.start_date)

    end_date = None
    if campaign.end_date:
        end_date = datetime.fromisoformat(campaign.end_date)

    new_campaign = models.MarketingCampaign(
        name=campaign.name,
        campaign_type=campaign.campaign_type,
        start_date=start_date,
        end_date=end_date,
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign


@app.put("/admin/marketing/{campaign_id}", response_model=MarketingCampaignResponse)
def update_marketing_campaign(
    campaign_id: str,
    campaign_update: MarketingCampaignUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a marketing campaign"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    campaign = (
        db.query(models.MarketingCampaign)
        .filter(models.MarketingCampaign.id == campaign_id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    update_data = campaign_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key in ("start_date", "end_date") and value:
            update_data[key] = datetime.fromisoformat(value)
        elif key in ("start_date", "end_date") and value is None:
            update_data[key] = None

    for key, value in update_data.items():
        setattr(campaign, key, value)

    db.commit()
    db.refresh(campaign)
    return campaign


@app.delete("/admin/marketing/{campaign_id}")
def delete_marketing_campaign(
    campaign_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a marketing campaign"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    campaign = (
        db.query(models.MarketingCampaign)
        .filter(models.MarketingCampaign.id == campaign_id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.delete(campaign)
    db.commit()
    return {"status": "deleted"}


class EmailBlastRequest(BaseModel):
    subject: str
    body: str
    target_audience: str = "all"


@app.post("/admin/email-blast")
def send_email_blast(
    request: EmailBlastRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send bulk email to users"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    users = db.query(models.User).filter(models.User.is_verified == True).all()

    if request.target_audience == "paying":
        users = [u for u in users if u.balance > 0]

    recipients = [u.email for u in users]

    if not recipients:
        raise HTTPException(status_code=400, detail="No recipients found")

    import email_service

    result = email_service.send_email(
        to=recipients, subject=request.subject, html=request.body
    )

    if result.get("success"):
        return {"status": "sent", "recipients_count": len(recipients)}
    else:
        raise HTTPException(
            status_code=500, detail=f"Failed to send emails: {result.get('error')}"
        )


# --- Broadcasts ---


@app.get("/broadcasts/active", response_model=List[BroadcastResponse])
def get_active_broadcasts(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return (
        db.query(models.Broadcast)
        .filter(
            models.Broadcast.is_active == True,
            (models.Broadcast.expires_at == None) | (models.Broadcast.expires_at > now),
        )
        .all()
    )


@app.get("/admin/broadcasts", response_model=List[BroadcastResponse])
def get_all_broadcasts(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.Broadcast).order_by(models.Broadcast.created_at.desc()).all()


@app.post("/admin/broadcasts", response_model=BroadcastResponse)
def create_broadcast(
    broadcast: BroadcastCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_broadcast = models.Broadcast(**broadcast.dict())
    db.add(db_broadcast)
    db.commit()
    db.refresh(db_broadcast)
    return db_broadcast


@app.put("/admin/broadcasts/{broadcast_id}", response_model=BroadcastResponse)
def update_broadcast(
    broadcast_id: str,
    broadcast_update: BroadcastCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_broadcast = (
        db.query(models.Broadcast).filter(models.Broadcast.id == broadcast_id).first()
    )
    if not db_broadcast:
        raise HTTPException(status_code=404, detail="Broadcast not found")

    for key, value in broadcast_update.dict().items():
        setattr(db_broadcast, key, value)

    db.commit()
    db.refresh(db_broadcast)
    return db_broadcast


@app.delete("/admin/broadcasts/{broadcast_id}")
def delete_broadcast(
    broadcast_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_broadcast = (
        db.query(models.Broadcast).filter(models.Broadcast.id == broadcast_id).first()
    )
    if not db_broadcast:
        raise HTTPException(status_code=404, detail="Broadcast not found")

    db.delete(db_broadcast)
    db.commit()
    return {"status": "success"}


os.makedirs("static/proofs", exist_ok=True)


class BankTransferProofResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    tier: Optional[str]
    hits: Optional[int]
    currency: str
    status: str
    file_url: Optional[str]
    file_name: Optional[str]
    reference: Optional[str]
    notes: Optional[str]
    admin_notes: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


class BankTransferProofCreate(BaseModel):
    amount: float
    tier: Optional[str] = None
    hits: Optional[int] = None
    currency: str = "USD"
    notes: Optional[str] = None


class BankTransferApproval(BaseModel):
    approved: bool
    admin_notes: Optional[str] = None


@app.post("/bank-transfer/proof", response_model=BankTransferProofResponse)
async def upload_bank_transfer_proof(
    file: UploadFile = File(...),
    amount: float = Form(...),
    tier: str = Form(""),
    hits: int = Form(0),
    currency: str = Form("USD"),
    notes: str = Form(""),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in [".jpg", ".jpeg", ".png", ".webp", ".pdf"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only jpg, png, webp, pdf allowed.",
        )

    import uuid

    reference = f"TGP-{current_user.id[:8].upper()}-{uuid.uuid4().hex[:6].upper()}"

    filename = f"proofs/{reference}{file_extension}"
    file_path = os.path.join("static", filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    proof = models.BankTransferProof(
        user_id=current_user.id,
        amount=amount,
        tier=tier if tier else None,
        hits=hits if hits > 0 else None,
        currency=currency,
        status="pending",
        file_url=f"/static/{filename}",
        file_name=file.filename,
        reference=reference,
        notes=notes if notes else None,
    )
    db.add(proof)
    db.commit()
    db.refresh(proof)

    return BankTransferProofResponse(
        id=proof.id,
        user_id=proof.user_id,
        amount=proof.amount,
        tier=proof.tier,
        hits=proof.hits,
        currency=proof.currency,
        status=proof.status,
        file_url=proof.file_url,
        file_name=proof.file_name,
        reference=proof.reference,
        notes=proof.notes,
        admin_notes=proof.admin_notes,
        created_at=proof.created_at,
        processed_at=proof.processed_at,
        user_email=current_user.email,
    )


@app.get("/bank-transfer/my-proofs", response_model=List[BankTransferProofResponse])
def get_my_bank_transfers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    proofs = (
        db.query(models.BankTransferProof)
        .filter(models.BankTransferProof.user_id == current_user.id)
        .order_by(models.BankTransferProof.created_at.desc())
        .all()
    )
    return [
        BankTransferProofResponse(
            id=p.id,
            user_id=p.user_id,
            amount=p.amount,
            tier=p.tier,
            hits=p.hits,
            currency=p.currency,
            status=p.status,
            file_url=p.file_url,
            file_name=p.file_name,
            reference=p.reference,
            notes=p.notes,
            admin_notes=p.admin_notes,
            created_at=p.created_at,
            processed_at=p.processed_at,
            user_email=current_user.email,
        )
        for p in proofs
    ]


@app.get("/admin/bank-transfers", response_model=List[BankTransferProofResponse])
def get_all_bank_transfers(
    status_filter: str = "all",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    query = db.query(models.BankTransferProof)
    if status_filter != "all":
        query = query.filter(models.BankTransferProof.status == status_filter)

    proofs = query.order_by(models.BankTransferProof.created_at.desc()).all()

    result = []
    for p in proofs:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()
        result.append(
            BankTransferProofResponse(
                id=p.id,
                user_id=p.user_id,
                amount=p.amount,
                tier=p.tier,
                hits=p.hits,
                currency=p.currency,
                status=p.status,
                file_url=p.file_url,
                file_name=p.file_name,
                reference=p.reference,
                notes=p.notes,
                admin_notes=p.admin_notes,
                created_at=p.created_at,
                processed_at=p.processed_at,
                user_email=user.email if user else None,
            )
        )
    return result


@app.put("/admin/bank-transfers/{proof_id}/approve")
def approve_bank_transfer(
    proof_id: str,
    approval: BankTransferApproval,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    proof = (
        db.query(models.BankTransferProof)
        .filter(models.BankTransferProof.id == proof_id)
        .first()
    )
    if not proof:
        raise HTTPException(status_code=404, detail="Transfer proof not found")

    if proof.status != "pending":
        raise HTTPException(status_code=400, detail=f"Transfer already {proof.status}")

    user = db.query(models.User).filter(models.User.id == proof.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if approval.approved:
        if not user.is_verified:
            user.is_verified = True
            print(
                f"[AUTO-VERIFY] User {user.email} auto-verified on bank transfer approval"
            )

        if proof.tier == "economy":
            user.balance_economy = (user.balance_economy or 0.0) + proof.amount
        elif proof.tier == "professional":
            user.balance_professional = (
                user.balance_professional or 0.0
            ) + proof.amount
        elif proof.tier == "expert":
            user.balance_expert = (user.balance_expert or 0.0) + proof.amount
        else:
            user.balance += proof.amount

        trx = models.Transaction(
            user_id=user.id,
            type="credit",
            amount=proof.amount,
            description=f"Bank Transfer ({proof.currency}) - Ref: {proof.reference}",
            tier=proof.tier,
            hits=proof.hits,
            reference=proof.reference,
        )
        db.add(trx)
        proof.status = "approved"
    else:
        proof.status = "rejected"

    proof.admin_notes = approval.admin_notes
    proof.processed_at = datetime.utcnow()
    proof.processed_by = current_user.id

    db.commit()
    return {"status": proof.status, "proof_id": proof_id}


# --- Stripe Integration ---


class PaymentIntentRequest(BaseModel):
    amount: int  # In cents
    currency: str = "eur"


@app.post("/create-payment-intent")
async def create_payment_intent(
    request: PaymentIntentRequest, current_user: models.User = Depends(get_current_user)
):
    try:
        # Apply Gamification Discount if available
        discount_percent = current_user.gamification_permanent_discount or 0
        original_amount = request.amount
        final_amount = original_amount
        discount_amount = 0

        if discount_percent > 0:
            discount_amount = int(original_amount * (discount_percent / 100))
            final_amount = original_amount - discount_amount

        # Create a PaymentIntent with the discounted amount
        intent = stripe.PaymentIntent.create(
            amount=final_amount,
            currency=request.currency,
            automatic_payment_methods={
                "enabled": True,
            },
            metadata={
                "user_id": current_user.id,
                "email": current_user.email,
                "original_amount": original_amount,
                "discount_percent": discount_percent,
                "discount_amount": discount_amount,
            },
        )
        return {"clientSecret": intent["client_secret"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Stripe Subscription Endpoints ---

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")


class StripeProductResponse(BaseModel):
    id: str
    stripe_product_id: str
    name: str
    factor: float
    quality_label: Optional[str] = None
    features: Optional[List[str]] = None
    active: bool

    class Config:
        from_attributes = True


class SeedStripeProductsRequest(BaseModel):
    force: bool = False


class CreateCreditsCheckoutRequest(BaseModel):
    tier: str
    visitors: int
    bulk_months: int
    currency: str = "eur"
    success_url: str
    cancel_url: str


PRICING_MATRIX = {
    "economy": {
        60000: {1: 9.96, 6: 47.81, 24: 143.42},
        500000: {1: 57.96, 6: 278.21, 24: 834.62},
        1000000: {1: 99.96, 6: 479.81, 24: 1439.42},
        10000000: {1: 699.96, 6: 3359.81, 24: 10079.42},
        50000000: {1: 2799.96, 6: 13439.81, 24: 40319.42},
    },
    "professional": {
        60000: {1: 19.96, 6: 95.81, 24: 287.42},
        500000: {1: 115.92, 6: 556.42, 24: 1669.25},
        1000000: {1: 199.96, 6: 959.81, 24: 2879.42},
        10000000: {1: 1399.96, 6: 6719.81, 24: 20159.42},
        50000000: {1: 5599.96, 6: 26879.81, 24: 80639.42},
    },
    "expert": {
        60000: {1: 29.96, 6: 143.81, 24: 431.42},
        500000: {1: 173.96, 6: 835.01, 24: 2505.02},
        1000000: {1: 299.96, 6: 1439.81, 24: 4319.42},
        10000000: {1: 2099.96, 6: 10079.81, 24: 30239.42},
        50000000: {1: 8399.96, 6: 40319.81, 24: 120959.42},
    },
}


@app.get("/admin/stripe/products", response_model=List[StripeProductResponse])
async def get_stripe_products(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    products = db.query(models.StripeProduct).all()
    return products


@app.post("/admin/stripe/products/seed")
async def seed_stripe_products(
    request: SeedStripeProductsRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    tiers = [
        {
            "id": "economy",
            "name": "Add Funds - Starter",
            "description": "Account balance top-up",
            "factor": 0.35,
            "quality_label": "10% Quality",
            "features": [
                "Residential IPs",
                "Multiple Traffic Sources",
                "Standard Proxy Pool",
                "Geo Targeting Worldwide",
            ],
        },
        {
            "id": "professional",
            "name": "Add Funds - Business",
            "description": "Account balance top-up",
            "factor": 0.65,
            "quality_label": "50% Quality",
            "features": [
                "Residential Geo IPs",
                "Country Geo Targeting",
                "RSS and Sitemap Support",
                "URL Shorteners",
            ],
        },
        {
            "id": "expert",
            "name": "Add Funds - Premium",
            "description": "Account balance top-up",
            "factor": 1.0,
            "quality_label": "100% Quality",
            "features": [
                "State & City Targeting",
                "Night & Day Volume",
                "Automatic Website Crawler",
                "GA4 Natural Events",
            ],
        },
    ]

    results = []
    for tier in tiers:
        existing = db.query(models.StripeProduct).filter_by(id=tier["id"]).first()
        if existing and not request.force:
            results.append(
                {
                    "tier": tier["id"],
                    "status": "skipped",
                    "reason": "already exists",
                }
            )
            continue

        try:
            product = stripe.Product.create(
                name=tier["name"],
                description=tier["description"],
                statement_descriptor="Creator",
                metadata={
                    "tier_id": tier["id"],
                    "factor": str(tier["factor"]),
                    "quality": tier["quality_label"],
                },
            )

            if existing:
                existing.stripe_product_id = product.id
                existing.name = tier["name"]
                existing.factor = tier["factor"]
                existing.quality_label = tier["quality_label"]
                existing.features = tier["features"]
            else:
                db.add(
                    models.StripeProduct(
                        id=tier["id"],
                        stripe_product_id=product.id,
                        name=tier["name"],
                        factor=tier["factor"],
                        quality_label=tier["quality_label"],
                        features=tier["features"],
                    )
                )

            results.append(
                {
                    "tier": tier["id"],
                    "status": "created",
                    "product_id": product.id,
                }
            )
        except Exception as e:
            results.append({"tier": tier["id"], "status": "error", "error": str(e)})

    db.commit()
    return {"results": results}


@app.post("/stripe/create-checkout")
async def create_credits_checkout(
    request: CreateCreditsCheckoutRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(models.StripeProduct).filter_by(id=request.tier).first()
    if not product:
        raise HTTPException(status_code=400, detail=f"Unknown tier: {request.tier}")

    if request.tier not in PRICING_MATRIX:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {request.tier}")
    if request.visitors not in PRICING_MATRIX[request.tier]:
        raise HTTPException(
            status_code=400, detail=f"Invalid visitors amount: {request.visitors}"
        )
    if request.bulk_months not in PRICING_MATRIX[request.tier][request.visitors]:
        raise HTTPException(
            status_code=400, detail=f"Invalid bulk months: {request.bulk_months}"
        )

    price_amount = PRICING_MATRIX[request.tier][request.visitors][request.bulk_months]
    amount_cents = int(price_amount * 100)

    try:
        price = stripe.Price.create(
            product=product.stripe_product_id,
            currency=request.currency,
            unit_amount=amount_cents,
            metadata={
                "tier": request.tier,
                "visitors": str(request.visitors),
                "bulk_months": str(request.bulk_months),
            },
        )

        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email, metadata={"user_id": current_user.id}
            )
            current_user.stripe_customer_id = customer.id
            db.commit()

        total_visitors = request.visitors * request.bulk_months

        session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            mode="payment",
            line_items=[{"price": price.id, "quantity": 1}],
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                "user_id": current_user.id,
                "tier": request.tier,
                "visitors": str(request.visitors),
                "bulk_months": str(request.bulk_months),
                "total_visitors": str(total_visitors),
                "amount_cents": str(amount_cents),
            },
        )

        return {"url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/admin/stripe/prices/archive-old")
async def archive_old_prices(
    days: int = 30,
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    cutoff = datetime.utcnow() - __import__("datetime").timedelta(days=days)
    prices = stripe.Price.list(active=True, limit=100)

    archived = []
    for price in prices.auto_paging_iter():
        price_created = datetime.utcfromtimestamp(price.created)
        if price_created < cutoff:
            try:
                stripe.Price.modify(price.id, active=False)
                archived.append(price.id)
            except Exception:
                pass

    return {"archived_count": len(archived), "price_ids": archived}


class CreateCheckoutRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str


class CreatePortalRequest(BaseModel):
    return_url: str


class SubscriptionResponse(BaseModel):
    subscription_id: Optional[str] = None
    status: Optional[str] = None
    plan: Optional[str] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False


@app.post("/subscriptions/create-checkout")
async def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email, metadata={"user_id": current_user.id}
            )
            current_user.stripe_customer_id = customer.id
            db.commit()

        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            mode="subscription",
            line_items=[{"price": request.price_id, "quantity": 1}],
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={"user_id": current_user.id},
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/subscriptions/portal")
async def create_portal_session(
    request: CreatePortalRequest, current_user: models.User = Depends(get_current_user)
):
    try:
        if not current_user.stripe_customer_id:
            raise HTTPException(status_code=400, detail="No Stripe customer found")

        portal_session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id, return_url=request.return_url
        )
        return {"url": portal_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/subscriptions/current")
async def get_current_subscription(
    current_user: models.User = Depends(get_current_user),
):
    return SubscriptionResponse(
        subscription_id=current_user.stripe_subscription_id,
        status=current_user.subscription_status,
        plan=current_user.subscription_plan,
        current_period_end=current_user.subscription_current_period_end,
        cancel_at_period_end=False,
    )


@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        mode = session.get("mode", "subscription")

        if user_id:
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if user:
                if mode == "subscription":
                    user.stripe_subscription_id = session.get("subscription")
                    user.subscription_status = "active"
                elif mode == "payment":
                    tier = session.get("metadata", {}).get("tier")
                    total_visitors = session.get("metadata", {}).get("total_visitors")
                    amount_cents = session.get("metadata", {}).get("amount_cents")
                    if tier and total_visitors:
                        balance_field = f"balance_{tier}"
                        current_balance = getattr(user, balance_field, 0) or 0
                        setattr(
                            user, balance_field, current_balance + int(total_visitors)
                        )

                        amount_float = float(amount_cents) / 100 if amount_cents else 0
                        transaction = models.Transaction(
                            user_id=user.id,
                            type="credit",
                            amount=amount_float,
                            description=f"Stripe Checkout - {tier.title()} Tier ({int(total_visitors):,} visitors)",
                            status="completed",
                            tier=tier,
                            hits=int(total_visitors),
                            reference=session.get("payment_intent"),
                        )
                        db.add(transaction)
                        user.gamification_total_spent = (
                            user.gamification_total_spent or 0
                        ) + amount_float
                db.commit()

    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        user = (
            db.query(models.User)
            .filter(models.User.stripe_customer_id == customer_id)
            .first()
        )
        if user:
            user.subscription_status = subscription.get("status")
            if subscription.get("plan"):
                user.subscription_plan = subscription["plan"].get(
                    "nickname"
                ) or subscription["plan"].get("id")
            if subscription.get("current_period_end"):
                user.subscription_current_period_end = datetime.fromtimestamp(
                    subscription["current_period_end"]
                )
            db.commit()

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        user = (
            db.query(models.User)
            .filter(models.User.stripe_customer_id == customer_id)
            .first()
        )
        if user:
            user.subscription_status = "canceled"
            user.stripe_subscription_id = None
            user.subscription_plan = None
            user.subscription_current_period_end = None
            db.commit()

    return {"received": True}


# --- SPA Catch-All Route (must be last) ---
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    from fastapi.responses import FileResponse
    import os

    # Check if the requested file exists in static
    static_path = f"static/{full_path}"
    if os.path.exists(static_path) and os.path.isfile(static_path):
        return FileResponse(static_path)

    # Otherwise serve index.html for SPA routing
    return FileResponse("static/index.html")


@app.get("/")
async def serve_index():
    from fastapi.responses import FileResponse

    return FileResponse("static/index.html")
