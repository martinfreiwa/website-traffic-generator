"""SQLAlchemy models for TrafficGen Pro SaaS"""

import datetime
import uuid
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="user")
    balance = Column(Float, default=0.0)
    balance_economy = Column(Float, default=0.0)
    balance_professional = Column(Float, default=0.0)
    balance_expert = Column(Float, default=0.0)
    api_key = Column(String, nullable=True, unique=True, index=True)
    affiliate_code = Column(String, nullable=True, unique=True, index=True)
    referred_by = Column(String, nullable=True)
    status = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    token_version = Column(Integer, default=0)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    vat_id = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    zip = Column(String, nullable=True)
    website = Column(String, nullable=True)
    display_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    job_title = Column(String, nullable=True)
    public_profile = Column(Boolean, default=False)
    two_factor_enabled = Column(Boolean, default=False)
    email_frequency = Column(String, nullable=True)
    login_notification_enabled = Column(Boolean, default=False)
    newsletter_sub = Column(Boolean, default=False)
    sound_effects = Column(Boolean, default=True)
    developer_mode = Column(Boolean, default=False)
    api_whitelist = Column(JSON, nullable=True)
    webhook_secret = Column(String, nullable=True)
    accessibility = Column(JSON, nullable=True)
    social_links = Column(JSON, nullable=True)
    login_history = Column(JSON, default=list)
    recovery_email = Column(String, nullable=True)
    timezone = Column(String, nullable=True)
    language = Column(String, nullable=True)
    theme_accent_color = Column(String, nullable=True)
    skills_badges = Column(JSON, nullable=True)
    referral_code = Column(String, nullable=True)
    support_pin = Column(String, nullable=True)
    date_format = Column(String, nullable=True)
    number_format = Column(String, nullable=True)
    require_password_reset = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)
    plan = Column(String, nullable=True)
    shadow_banned = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    password_reset_token = Column(String, nullable=True)
    password_reset_token_expires = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    ban_reason = Column(String, nullable=True)
    last_ip = Column(String, nullable=True)
    last_active = Column(DateTime, nullable=True)
    api_key_last_used = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    subscription_status = Column(String, nullable=True)
    subscription_plan = Column(String, nullable=True)
    subscription_current_period_end = Column(DateTime, nullable=True)

    # Relationships
    projects = relationship("Project", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String, index=True)
    status = Column(String, default="active")
    plan_type = Column(String, default="Custom")
    tier = Column(String, nullable=True)

    daily_limit = Column(Integer, default=0)
    total_target = Column(Integer, default=0)
    hits_today = Column(Integer, default=0)
    total_hits = Column(Integer, default=0)
    start_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    settings = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="projects")
    traffic_logs = relationship("TrafficLog", back_populates="project")
    stats = relationship("ProjectStats", back_populates="project")

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
    url = Column(String)
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
    event_type = Column(String)
    status = Column(String)
    country = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    proxy = Column(String, nullable=True)
    session_duration = Column(Float, nullable=True)
    pages_viewed = Column(Integer, default=1)
    device_type = Column(String, nullable=True)
    traffic_source = Column(String, nullable=True)
    bounced = Column(Boolean, default=False)

    project = relationship("Project", back_populates="traffic_logs")


class ProjectStats(Base):
    __tablename__ = "project_stats"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    hour = Column(DateTime, nullable=False)
    total_visitors = Column(Integer, default=0)
    successful_hits = Column(Integer, default=0)
    failed_hits = Column(Integer, default=0)
    bounce_count = Column(Integer, default=0)
    avg_session_duration = Column(Float, default=0.0)
    desktop_visitors = Column(Integer, default=0)
    mobile_visitors = Column(Integer, default=0)
    tablet_visitors = Column(Integer, default=0)
    organic_visitors = Column(Integer, default=0)
    social_visitors = Column(Integer, default=0)
    direct_visitors = Column(Integer, default=0)
    referral_visitors = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="stats")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    subject = Column(String)
    status = Column(String, default="open")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship("TicketMessage", back_populates="ticket")
    user = relationship("User")


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    ticket_id = Column(String, ForeignKey("tickets.id"))
    sender_id = Column(String)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    ticket = relationship("Ticket", back_populates="messages")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    message = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AffiliateEarning(Base):
    __tablename__ = "affiliate_earnings"

    id = Column(String, primary_key=True, default=generate_uuid)
    affiliate_id = Column(String, ForeignKey("users.id"))
    referee_id = Column(String, ForeignKey("users.id"))
    amount = Column(Float)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True)
    settings = Column(JSON, default=dict)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )


class Broadcast(Base):
    __tablename__ = "broadcasts"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info")  # 'info', 'warning', 'critical', 'success'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    action_url = Column(String, nullable=True)
    action_text = Column(String, nullable=True)
