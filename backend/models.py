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


class AffiliateRelation(Base):
    __tablename__ = "affiliate_relations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    referrer_l1_id = Column(String, ForeignKey("users.id"), nullable=True)
    referrer_l2_id = Column(String, ForeignKey("users.id"), nullable=True)
    referrer_l3_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship(
        "User", back_populates="affiliate_relation", foreign_keys=[user_id]
    )


class BenefitRequest(Base):
    __tablename__ = "benefit_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    benefit_type = Column(String, nullable=False)
    benefit_category = Column(String, nullable=False)
    url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    screenshot_url = Column(String, nullable=True)
    claimed_value = Column(Float, default=0.0)
    approved_value = Column(Float, nullable=True)
    status = Column(String, default="pending")
    admin_notes = Column(Text, nullable=True)
    fraud_flagged = Column(Boolean, default=False)
    fraud_reason = Column(String, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True)

    user = relationship(
        "User", back_populates="benefit_requests", foreign_keys=[user_id]
    )
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class PayoutRequest(Base):
    __tablename__ = "payout_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    amount = Column(Float)
    method = Column(String)
    payout_details = Column(JSON)
    status = Column(String, default="pending")
    admin_notes = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    processed_by = Column(String, ForeignKey("users.id"), nullable=True)
    transaction_hash = Column(String, nullable=True)

    user = relationship(
        "User", back_populates="payout_requests", foreign_keys=[user_id]
    )
    processor = relationship("User", foreign_keys=[processed_by])


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
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
    token_version = Column(Integer, default=1)
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

    # Gamification & Streak
    gamification_xp = Column(Integer, default=0)
    gamification_level = Column(Integer, default=1)
    gamification_total_spent = Column(Float, default=0.0)
    gamification_permanent_discount = Column(Integer, default=0)
    gamification_claimed_levels = Column(JSON, default=list)
    streak_days = Column(Integer, default=0)
    streak_last_date = Column(DateTime, nullable=True)
    streak_best = Column(Integer, default=0)
    last_daily_bonus = Column(DateTime, nullable=True)

    # Benefits & Affiliate
    benefit_balance = Column(Float, default=0.0)
    total_benefits_claimed = Column(Float, default=0.0)
    benefit_requests_count = Column(Integer, default=0)
    account_locked = Column(Boolean, default=False)
    lock_reason = Column(String, nullable=True)
    locked_at = Column(DateTime, nullable=True)

    # Relationships
    projects = relationship("Project", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    affiliate_tier = relationship("AffiliateTier", back_populates="user", uselist=False)
    affiliate_relation = relationship(
        "AffiliateRelation",
        back_populates="user",
        uselist=False,
        foreign_keys=[AffiliateRelation.user_id],
    )
    benefit_requests = relationship(
        "BenefitRequest", back_populates="user", foreign_keys=[BenefitRequest.user_id]
    )
    payout_requests = relationship(
        "PayoutRequest", back_populates="user", foreign_keys=[PayoutRequest.user_id]
    )
    sessions = relationship("UserSession", back_populates="user")


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
    priority = Column(String, default="low")
    type = Column(String, default="ticket")
    category = Column(String, default="general")
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    attachment_urls = Column(JSON, default=list)
    messages = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    user = relationship("User")
    project = relationship("Project", foreign_keys=[project_id])


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    ticket_id = Column(String, ForeignKey("tickets.id"))
    sender_id = Column(String)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    ticket = relationship("Ticket")


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
    referrer_id = Column(String, ForeignKey("users.id"))
    referee_id = Column(String, ForeignKey("users.id"))
    transaction_id = Column(String, ForeignKey("transactions.id"))
    amount = Column(Float)
    status = Column(String, default="pending")
    tier = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    referrer = relationship("User", foreign_keys=[referrer_id])
    referee = relationship("User", foreign_keys=[referee_id])


class BenefitType(Base):
    __tablename__ = "benefit_types"

    id = Column(String, primary_key=True, default=generate_uuid)
    type = Column(String, nullable=False)
    category = Column(String, nullable=False)
    name = Column(String, nullable=False)
    value = Column(Float, default=0.0)
    requirements = Column(JSON, default=dict)
    active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AffiliateTier(Base):
    __tablename__ = "affiliate_tiers"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    tier_level = Column(Integer, default=1)
    tier_name = Column(String, default="Bronze Starter")
    commission_rate_l1 = Column(Float, default=0.15)
    commission_rate_l2 = Column(Float, default=0.05)
    commission_rate_l3 = Column(Float, default=0.02)
    total_referrals_l1 = Column(Integer, default=0)
    total_referrals_l2 = Column(Integer, default=0)
    total_referrals_l3 = Column(Integer, default=0)
    total_earnings = Column(Float, default=0.0)
    pending_payout = Column(Float, default=0.0)
    lifetime_payout = Column(Float, default=0.0)
    last_tier_update = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="affiliate_tier")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    session_token = Column(String, unique=True, index=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    device = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    current_page = Column(String, nullable=True)
    total_visits = Column(Integer, default=1)
    status = Column(String, default="active")
    last_active = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")


class ConversionSettings(Base):
    __tablename__ = "conversion_settings"

    id = Column(String, primary_key=True, default="global")
    social_proof_enabled = Column(Boolean, default=False)
    social_proof_position = Column(String, default="bottom-right")
    social_proof_delay = Column(Integer, default=5)
    social_proof_show_simulated = Column(Boolean, default=True)
    exit_intent_enabled = Column(Boolean, default=False)
    exit_intent_headline = Column(String, default="Wait! Don't miss out!")
    exit_intent_subtext = Column(String, default="Get 10% off your first order")
    exit_intent_coupon_code = Column(String, default="WELCOME10")
    promo_bar_enabled = Column(Boolean, default=False)
    promo_bar_message = Column(String, default="Free shipping on orders over $50!")
    promo_bar_button_text = Column(String, default="Shop Now")
    promo_bar_button_url = Column(String, default="/pricing")
    promo_bar_background_color = Column(String, default="#000000")
    promo_bar_text_color = Column(String, default="#ffffff")
    promo_bar_countdown_end = Column(DateTime, nullable=True)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )


class LoyaltySettings(Base):
    __tablename__ = "loyalty_settings"

    id = Column(String, primary_key=True, default="global")
    enabled = Column(Boolean, default=False)
    points_per_dollar = Column(Float, default=1.0)
    redemption_rate = Column(Float, default=0.01)
    bonus_signup_points = Column(Integer, default=100)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )


class ReferralSettings(Base):
    __tablename__ = "referral_settings"

    id = Column(String, primary_key=True, default="global")
    enabled = Column(Boolean, default=False)
    referrer_reward_type = Column(String, default="percentage")
    referrer_reward_value = Column(Float, default=10.0)
    referee_reward_type = Column(String, default="percentage")
    referee_reward_value = Column(Float, default=15.0)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )


class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(String, primary_key=True, default=generate_uuid)
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String, default="general")
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, nullable=False, index=True)
    discount_type = Column(String, default="percentage")
    discount_value = Column(Float, nullable=False)
    min_purchase = Column(Float, default=0.0)
    max_uses = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    max_uses_per_user = Column(Integer, default=1)
    plan_restriction = Column(String, nullable=True)
    duration = Column(String, default="once")
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MarketingCampaign(Base):
    __tablename__ = "marketing_campaigns"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    campaign_type = Column(String, default="ad_tracking")
    status = Column(String, default="active")
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)
    spend = Column(Float, default=0.0)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
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


class StripeProduct(Base):
    __tablename__ = "stripe_products"

    id = Column(String, primary_key=True)
    stripe_product_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    factor = Column(Float, nullable=False)
    quality_label = Column(String, nullable=True)
    features = Column(JSON, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
