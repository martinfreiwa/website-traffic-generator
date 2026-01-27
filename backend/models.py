from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Scheduling
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    active_hours_start = Column(Integer, nullable=True) # 0-23
    active_hours_end = Column(Integer, nullable=True)   # 0-23
    
    # Configuration
    visitors_per_min = Column(Integer, default=100)
    mode = Column(String, default="direct_hit") # "visit" or "direct_hit"
    returning_visitor_pct = Column(Integer, default=0)
    bounce_rate_pct = Column(Integer, default=0)
    referrer = Column(String, default="")
    
    # Phase 3: Targeting & Sources
    target_country = Column(String, nullable=True) # ISO code
    target_state = Column(String, nullable=True)   # State name or code
    target_city = Column(String, nullable=True)    # City name or code
    traffic_source_preset = Column(String, default="direct") # "direct", "organic", "social"
    utm_tags = Column(JSON, nullable=True) # {source, medium, campaign, content, term}
    device_distribution = Column(JSON, nullable=True) # {desktop, mobile, tablet}
    enable_circadian_rhythm = Column(Boolean, default=False)
    daily_visitor_limit = Column(Integer, nullable=True)
    hits_today = Column(Integer, default=0)
    is_dry_run = Column(Boolean, default=False)
    tier = Column(String, default="professional") # "economy", "professional"
    
    targets = relationship("Target", back_populates="project", cascade="all, delete-orphan")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_run = Column(DateTime, nullable=True)

class Target(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    url = Column(String)
    title = Column(String, nullable=True)
    tid = Column(String, nullable=True) # GA4 Tracking ID
    
    project = relationship("Project", back_populates="targets")
    funnel_steps = relationship("FunnelStep", back_populates="target", cascade="all, delete-orphan")

class FunnelStep(Base):
    __tablename__ = "funnel_steps"

    id = Column(Integer, primary_key=True, index=True)
    target_id = Column(Integer, ForeignKey("targets.id"))
    url = Column(String)
    title = Column(String, nullable=True)
    order = Column(Integer, default=0)
    
    target = relationship("Target", back_populates="funnel_steps")

class Proxy(Base):
    __tablename__ = "proxies"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String) # e.g. http://user:pass@host:port
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TrafficLog(Base):
    __tablename__ = "traffic_log"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    url = Column(String)
    event_type = Column(String) # e.g. "page_view", "session_start"
    status = Column(String) # "success", "failure"
    proxy = Column(String, nullable=True)
    tid = Column(String, nullable=True)
