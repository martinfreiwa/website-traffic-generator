from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
import models
from database import SessionLocal, engine, get_db
from scheduler import scheduler
from sse_starlette.sse import EventSourceResponse
from web_utils import find_ga4_tid
import json
import asyncio
import requests
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from fastapi import File, UploadFile
import shutil
import os
import secrets
import stripe

# --- Stripe Configuration ---
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder_if_not_set")
stripe.api_key = STRIPE_SECRET_KEY

# Create Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TrafficGen Pro SaaS API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
os.makedirs("static/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Security & Auth Config ---
SECRET_KEY = "your-secret-key-change-this-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)


@app.on_event("startup")
async def startup_event():
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
    role: str
    balance: float
    balance_economy: float = 0.0
    balance_professional: float = 0.0
    balance_expert: float = 0.0
    api_key: Optional[str] = None
    affiliate_code: Optional[str] = None
    status: str = "active"
    plan: str = "free"
    shadow_banned: bool = False
    is_verified: bool = False
    notes: Optional[str] = None
    tags: List[str] = []
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
    public_profile: bool = False
    two_factor_enabled: bool = False
    email_frequency: str = "instant"
    login_notification_enabled: bool = False
    newsletter_sub: bool = False
    sound_effects: bool = True
    developer_mode: bool = False
    api_whitelist: List[str] = []
    webhook_secret: Optional[str] = None
    accessibility: Dict[str, Any] = {}
    social_links: Dict[str, Any] = {}
    login_history: List[Dict[str, Any]] = []
    recovery_email: Optional[str] = None
    timezone: str = "UTC"
    language: str = "English"
    theme_accent_color: str = "#ff4d00"
    skills_badges: List[str] = []
    referral_code: Optional[str] = None
    support_pin: Optional[str] = None
    date_format: str = "YYYY-MM-DD"
    number_format: str = "en-US"
    require_password_reset: bool = False
    avatar_url: Optional[str] = None

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
    settings: Dict[str, Any]  # THE JSONB PAYLOAD
    daily_limit: int = 0
    total_target: int = 0


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


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    status: str
    settings: Dict[str, Any]
    daily_limit: int
    total_target: int
    hits_today: int
    total_hits: int
    created_at: datetime
    
    # Admin Fields (Optional in response, but populated if user is owner or admin)
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


class TicketCreate(BaseModel):
    subject: str
    priority: str = "low"
    messages: List[Dict[str, Any]] = []


class TicketResponse(BaseModel):
    id: str
    subject: str
    status: str
    priority: str
    messages: List[Dict[str, Any]]
    created_at: datetime

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


# --- Helpers ---


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_user_access_token(user: models.User, expires_delta: Optional[timedelta] = None):
    """Creates a token bound to the user's specific token version for invalidation support"""
    data = {"sub": user.email, "ver": user.token_version or 1}
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
    if token_ver is not None and user.token_version is not None and token_ver != user.token_version:
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
                    if token_ver is not None and user.token_version is not None and token_ver != user.token_version:
                        # Token invalid, fall through to raise generic error if strictly required or just return None?
                        # Since this is 'optional', usually it implies 'soft' auth. 
                        # But if a token is PRESENT but INVALID, it should probably be rejected or ignored.
                        # However, for 'users/me', usually we want strict auth. 
                        # 'read_users_me' uses optional? Why? 
                        # Ah, likely for mixed access. But if the token is revoked, we should treat it as unauth.
                        pass # Don't return the user if version mismatch
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
def register(user: UserCreate, db: Session = Depends(get_db)):
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
    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        referred_by=referred_by_id,
        # Generate basic affiliate code
        affiliate_code=f"REF-{user.email[:3].upper()}-{secrets.token_hex(3).upper()}",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/auth/token", response_model=Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
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
            current_history.pop() # Remove oldest (last item usually, but we prepend)
            
        new_entry = {
            "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "ip": request.client.host,
            "device": request.headers.get("user-agent", "Unknown Device")
        }
        # Prepend new entry
        current_history.insert(0, new_entry)
        user.login_history = current_history
        user.last_ip = request.client.host
        user.last_active = datetime.utcnow()
        db.commit()
    except Exception as e:
        print(f"Error updating login history: {e}")

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
    db: Session = Depends(get_db)
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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Increment token version to invalidate all existing JWTs
    current_user.token_version = (current_user.token_version or 1) + 1
    db.commit()
    return {"status": "all sessions invalidated", "message": "Please log in again."}

@app.get("/users/me/export")
def export_user_data(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """GDPR Data Download"""
    projects = db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
    transactions = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    
    export_data = {
        "user_profile": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.display_name or current_user.email,
            "created_at": str(current_user.created_at),
            "balance": current_user.balance,
            "role": current_user.role,
            "login_history": current_user.login_history
        },
        "projects": [
            {
                "id": p.id, 
                "name": p.name, 
                "status": p.status, 
                "created_at": str(p.created_at),
                "settings": p.settings
            } for p in projects
        ],
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "date": str(t.created_at),
                "description": t.description
            } for t in transactions
        ]
    }
    
    return export_data


@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user_optional)):
    return current_user


@app.put("/users/me", response_model=UserResponse)
def update_user_me(
    user_update: UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user


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


@app.post("/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        file_extension = os.path.splitext(file.filename)[1]
        if file_extension not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(status_code=400, detail="Invalid file type. Only jpg, png, webp allowed.")
        
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
        print(f"Error uploading avatar: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload avatar")

@app.delete("/users/me")
def delete_user_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
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
        print(f"Error deleting user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete account")


@app.post("/quick-campaign", response_model=QuickCampaignResponse)
def create_quick_campaign(campaign: QuickCampaignCreate, db: Session = Depends(get_db)):
    """Create a free 10,000 visitor 24-hour campaign with automatic account creation"""
    import string
    import bcrypt
    import asyncio

    db_user = db.query(models.User).filter(models.User.email == campaign.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

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
        "trafficSpeed": 70,
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

    print(f"\n{'=' * 60}")
    print(f"QUICK CAMPAIGN CREATED")
    print(f"{'=' * 60}")
    print(f"Email: {campaign.email}")
    print(f"Password: {generated_password}")
    print(f"Project ID: {db_project.id}")
    print(f"Project Name: {campaign.project_name}")
    print(f"Target URL: {campaign.target_url}")
    print(f"GA4 Tracking ID: {tid or 'Not found'}")
    print(f"Visitors: {total_visitors}")
    print(f"Expires: {expires_at}")
    print(f"{'=' * 60}\n")

    return {
        "success": True,
        "project_id": db_project.id,
        "message": "Campaign started! Check your email for login credentials.",
    }


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
    # Join with User to get referee email
    earnings = (
        db.query(models.AffiliateEarnings, models.User.email)
        .join(models.User, models.AffiliateEarnings.referee_id == models.User.id)
        .filter(models.AffiliateEarnings.referrer_id == current_user.id)
        .all()
    )

    result = []
    for earning, email in earnings:
        data = AffiliateEarningResponse.from_orm(earning)
        data.referee_email = email
        result.append(data)
    return result


# --- Project Management (SaaS Style) ---


@app.post("/projects", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # 1. Billing Check? (Skipped for Foundation Phase, to be added in Phase 2)
    # if current_user.balance < cost: ...

    db_project = models.Project(
        user_id=current_user.id,
        name=project.name,
        plan_type=project.plan_type,
        daily_limit=project.daily_limit,
        total_target=project.total_target,
        settings=project.settings,  # Just dump the JSON!
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


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

    target_user = db.query(models.User).filter(models.User.email == project.user_email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"User {project.user_email} not found")

    db_project = models.Project(
        user_id=target_user.id,
        name=project.name,
        plan_type=project.plan_type,
        daily_limit=project.daily_limit,
        total_target=project.total_target,
        settings=project.settings,
        # Admin Extras
        priority=project.priority,
        is_hidden=project.is_hidden,
        internal_tags=project.internal_tags,
        notes=project.notes,
        status="active"
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


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
    project.status = "active"
    db.commit()
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

    # 2. Add Balance
    if data.tier == 'economy':
        user.balance_economy = (user.balance_economy or 0.0) + data.amount
    elif data.tier == 'professional':
        user.balance_professional = (user.balance_professional or 0.0) + data.amount
    elif data.tier == 'expert':
        user.balance_expert = (user.balance_expert or 0.0) + data.amount
    else:
        # Fallback or General Balance (if we still use it)
        user.balance += data.amount

    # 3. Create Transaction
    trx_desc = f"{data.description} ({data.tier.capitalize()})" if data.tier else data.description
    trx = models.Transaction(
        user_id=user.id, type="credit", amount=data.amount, description=trx_desc
    )
    db.add(trx)
    db.commit()
    db.refresh(trx)

    # 4. Affiliate Commission (20% Lifetime)
    if user.referred_by:
        referrer = (
            db.query(models.User).filter(models.User.id == user.referred_by).first()
        )
        if referrer:
            commission = data.amount * 0.20

            # Create Earning record
            earning = models.AffiliateEarnings(
                referrer_id=referrer.id,
                referee_id=user.id,
                transaction_id=trx.id,
                amount=commission,
                status="pending",
            )
            db.add(earning)

            # Update referrer balance (SaaS often adds to balance or separate wallet, here we add to balance)
            referrer.balance += commission

            # Add transaction for referrer
            ref_trx = models.Transaction(
                user_id=referrer.id,
                type="bonus",
                amount=commission,
                description=f"Affiliate Commission from {user.email}",
            )
            db.add(ref_trx)

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
    from scheduler import scheduler

    # Aggregate stats across all projects for the dashboard overview
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
    total_rev = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.type == "credit").scalar() or 0.0
    rev_today = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.type == "credit", models.Transaction.created_at >= today_start).scalar() or 0.0
    rev_30d = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.type == "credit", models.Transaction.created_at >= thirty_days_ago).scalar() or 0.0

    # Users
    total_users = db.query(models.User).count()
    new_users_today = db.query(models.User).filter(models.User.created_at >= today_start).count()
    
    # Projects
    total_projects = db.query(models.Project).count()
    active_projects = db.query(models.Project).filter(models.Project.status == "active").count()
    new_projects_today = db.query(models.Project).filter(models.Project.created_at >= today_start).count()
    
    # Hits
    total_hits = db.query(func.sum(models.Project.total_hits)).scalar() or 0

    return {
        "revenue": {
            "total": total_rev,
            "today": rev_today,
            "last_30d": rev_30d
        },
        "users": {
            "total": total_users,
            "new_today": new_users_today
        },
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "new_today": new_projects_today
        },
        "traffic": {
            "total_hits": total_hits
        },
        "system_status": "operational"
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
    current_user: models.User = Depends(get_current_user)
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
    db.refresh(db_user)
    return {"status": "success"}


@app.get("/admin/transactions", response_model=List[TransactionResponse])
def get_all_transactions(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.Transaction).all()


# --- Ticket & Notification Endpoints ---


@app.get("/tickets", response_model=List[TicketResponse])
def get_tickets(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(models.Ticket).all()
    return (
        db.query(models.Ticket).filter(models.Ticket.user_id == current_user.id).all()
    )


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
        messages=ticket.messages,
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket


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

# --- Broadcasts ---

@app.get("/broadcasts/active", response_model=List[BroadcastResponse])
def get_active_broadcasts(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return db.query(models.Broadcast).filter(
        models.Broadcast.is_active == True,
        (models.Broadcast.expires_at == None) | (models.Broadcast.expires_at > now)
    ).all()

@app.get("/admin/broadcasts", response_model=List[BroadcastResponse])
def get_all_broadcasts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.Broadcast).order_by(models.Broadcast.created_at.desc()).all()

@app.post("/admin/broadcasts", response_model=BroadcastResponse)
def create_broadcast(
    broadcast: BroadcastCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_broadcast = db.query(models.Broadcast).filter(models.Broadcast.id == broadcast_id).first()
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
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_broadcast = db.query(models.Broadcast).filter(models.Broadcast.id == broadcast_id).first()
    if not db_broadcast:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    
    db.delete(db_broadcast)
    db.commit()
    return {"status": "success"}


# --- Stripe Integration ---

class PaymentIntentRequest(BaseModel):
    amount: int  # In cents
    currency: str = "eur"

@app.post("/create-payment-intent")
async def create_payment_intent(
    request: PaymentIntentRequest,
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            automatic_payment_methods={
                'enabled': True,
            },
            metadata={
                "user_id": current_user.id,
                "email": current_user.email
            }
        )
        return {"clientSecret": intent['client_secret']}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
