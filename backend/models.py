from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Boolean,
    JSON,
    Float,
    Text,
)
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="user")  # 'user', 'admin'
    balance = Column(Float, default=0.00)
    balance_economy = Column(Float, default=0.00)
    balance_professional = Column(Float, default=0.00)
    balance_expert = Column(Float, default=0.00)
    api_key = Column(String, unique=True, nullable=True)

    # Affiliate Info
    affiliate_code = Column(String, unique=True, nullable=True)
    referred_by = Column(String, ForeignKey("users.id"), nullable=True)

    status = Column(String, default="active")  # 'active', 'suspended'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    token_version = Column(Integer, default=1)

    # Extended Profile
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    vat_id = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    zip = Column(String, nullable=True)
    website = Column(String, nullable=True)

    # New Profile Fields
    display_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    job_title = Column(String, nullable=True)
    public_profile = Column(Boolean, default=False)
    two_factor_enabled = Column(Boolean, default=False)
    email_frequency = Column(String, default="instant")
    login_notification_enabled = Column(Boolean, default=False)
    newsletter_sub = Column(Boolean, default=False)
    sound_effects = Column(Boolean, default=True)
    developer_mode = Column(Boolean, default=False)
    api_whitelist = Column(JSON, default=list)  # List of IP strings
    webhook_secret = Column(String, nullable=True)
    accessibility = Column(
        JSON,
        default=lambda: {
            "colorBlindMode": False,
            "compactMode": False,
            "fontSize": "medium",
            "reduceMotion": False,
        },
    )
    social_links = Column(JSON, default=dict)
    login_history = Column(JSON, default=list)
    recovery_email = Column(String, nullable=True)
    timezone = Column(String, default="UTC")
    language = Column(String, default="English")
    theme_accent_color = Column(String, default="#ff4d00")
    skills_badges = Column(JSON, default=list)
    referral_code = Column(String, nullable=True)
    support_pin = Column(String, nullable=True)
    date_format = Column(String, default="YYYY-MM-DD")
    number_format = Column(String, default="en-US")
    require_password_reset = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)

    # Administrative Fields
    plan = Column(String, default="free")  # 'free', 'pro', 'agency'
    shadow_banned = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    password_reset_token = Column(String, nullable=True)
    password_reset_token_expires = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)  # Admin private notes
    tags = Column(JSON, default=list)  # List of strings e.g. ["VIP", "High Risk"]
    ban_reason = Column(String, nullable=True)
    last_ip = Column(String, nullable=True)
    last_active = Column(DateTime, nullable=True)

    # Additional security fields
    api_key_last_used = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, nullable=True)

    # Subscription fields
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    subscription_status = Column(
        String, default="inactive"
    )  # active, inactive, past_due, canceled
    subscription_plan = Column(String, nullable=True)  # starter, professional, agency
    subscription_current_period_end = Column(DateTime, nullable=True)

    projects = relationship("Project", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    # Self-referential relationship for affiliates
    referrer = relationship("User", remote_side=[id], backref="referrals")


class AffiliateEarnings(Base):
    __tablename__ = "affiliate_earnings"

    id = Column(String, primary_key=True, default=generate_uuid)
    referrer_id = Column(String, ForeignKey("users.id"))
    referee_id = Column(String, ForeignKey("users.id"))  # The user who bought creates
    transaction_id = Column(String, ForeignKey("transactions.id"))
    amount = Column(Float)
    status = Column(String, default="pending")  # 'pending', 'paid'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String, index=True)
    status = Column(String, default="active")  # 'active', 'stopped', 'completed'
    plan_type = Column(String, default="Custom")
    tier = Column(String, nullable=True)  # 'economy', 'professional', 'expert'

    # High Level Constraints (for easy querying without parsing JSON)
    daily_limit = Column(Integer, default=0)
    total_target = Column(Integer, default=0)
    hits_today = Column(Integer, default=0)
    total_hits = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=True)

    # THE CORE CONFIG
    # Stores the full ProjectSettings object from frontend
    settings = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="projects")
    traffic_logs = relationship("TrafficLog", back_populates="project")

    # Admin Fields
    priority = Column(Integer, default=0)
    force_stop_reason = Column(String, nullable=True)
    is_hidden = Column(Boolean, default=False)
    internal_tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)
    is_flagged = Column(Boolean, default=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String)
    amount = Column(Float)
    description = Column(String, nullable=True)
    status = Column(String, default="completed")
    tier = Column(String, nullable=True)
    reference = Column(String, nullable=True)
    hits = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")


class Proxy(Base):
    __tablename__ = "proxies"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)  # e.g. http://user:pass@host:port
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class TrafficLog(Base):
    __tablename__ = "traffic_log"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    url = Column(String)
    event_type = Column(String)  # "hit", "visit"
    status = Column(String)  # "success", "failure"
    country = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    proxy = Column(String, nullable=True)

    project = relationship("Project", back_populates="traffic_logs")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    subject = Column(String)
    status = Column(String, default="open")  # 'open', 'in-progress', 'closed'
    priority = Column(String, default="low")  # 'low', 'medium', 'high'
    type = Column(String, default="ticket")  # 'ticket' or 'chat'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    messages = Column(
        JSON, default=[]
    )  # List of {sender: 'user'|'admin', text: str, date: str}

    user = relationship("User", backref="tickets")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    message = Column(String)
    type = Column(String, default="info")  # 'info', 'success', 'warning', 'error'
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", backref="notifications")


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True)
    settings = Column(JSON, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )


class Broadcast(Base):
    __tablename__ = "broadcasts"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    action_url = Column(String, nullable=True)
    action_text = Column(String, nullable=True)


class BankTransferProof(Base):
    __tablename__ = "bank_transfer_proofs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    tier = Column(String, nullable=True)
    hits = Column(Integer, nullable=True)
    currency = Column(String, default="USD")
    status = Column(String, default="pending")
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    reference = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    processed_by = Column(String, ForeignKey("users.id"), nullable=True)

    user = relationship("User", foreign_keys=[user_id], backref="bank_transfers")
    processor = relationship("User", foreign_keys=[processed_by])


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(
        String, ForeignKey("users.id"), nullable=True
    )  # Can be null for system events
    action_type = Column(
        String, nullable=False
    )  # 'login', 'logout', 'project_created', 'project_started', 'purchase', 'settings_change', etc.
    action_detail = Column(JSON, default=dict)  # Additional details as JSON
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", backref="activity_logs")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    token_hash = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    device_info = Column(JSON, default=dict)  # Parsed device info
    location = Column(String, nullable=True)  # Geo-located from IP
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", backref="sessions")


class ImpersonationLog(Base):
    __tablename__ = "impersonation_log"

    id = Column(String, primary_key=True, default=generate_uuid)
    admin_id = Column(String, ForeignKey("users.id"))
    target_user_id = Column(String, ForeignKey("users.id"))
    action = Column(String, nullable=False)  # 'start', 'end'
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    admin = relationship("User", foreign_keys=[admin_id], backref="impersonation_logs")
    target_user = relationship(
        "User", foreign_keys=[target_user_id], backref="was_impersonated_by"
    )


class BalanceAdjustmentLog(Base):
    __tablename__ = "balance_adjustment_log"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    admin_id = Column(String, ForeignKey("users.id"), nullable=True)
    adjustment_type = Column(String, nullable=False)  # 'credit', 'debit'
    tier = Column(
        String, nullable=True
    )  # 'economy', 'professional', 'expert', 'general'
    amount = Column(Float, default=0)  # Euro amount
    hits = Column(Integer, nullable=True)  # Hits amount (if applicable)
    reason = Column(String, nullable=True)
    notes = Column(String, nullable=True)  # Additional admin notes
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], backref="balance_adjustments")
    admin = relationship(
        "User", foreign_keys=[admin_id], backref="balance_adjustments_made"
    )


class EmailLog(Base):
    __tablename__ = "email_log"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(
        String, ForeignKey("users.id"), nullable=True
    )  # Can be null for system emails
    email_type = Column(
        String, nullable=False
    )  # 'password_reset', 'verification', 'receipt', 'alert', etc.
    to_email = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    status = Column(String, default="sent")  # 'sent', 'delivered', 'bounced', 'failed'
    error_message = Column(String, nullable=True)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
    delivered_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="email_logs")


class UserNotificationPrefs(Base):
    __tablename__ = "user_notification_prefs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    email_marketing = Column(Boolean, default=True)
    email_transactional = Column(Boolean, default=True)
    email_alerts = Column(Boolean, default=True)
    browser_notifications = Column(Boolean, default=True)
    newsletter_sub = Column(Boolean, default=False)
    email_frequency = Column(String, default="instant")  # 'instant', 'daily', 'weekly'
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", backref="notification_prefs")


class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id = Column(String, primary_key=True, default=generate_uuid)
    token = Column(String, unique=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    reason = Column(
        String, nullable=True
    )  # 'logout', 'admin_terminate', 'password_change', 'security'
    expires_at = Column(DateTime, nullable=False)
    blacklisted_at = Column(DateTime, default=datetime.datetime.utcnow)
