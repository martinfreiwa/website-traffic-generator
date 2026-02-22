from database import SessionLocal
import models
from main import ProjectResponse

db = SessionLocal()
projects = db.query(models.Project).all()

for p in projects:
    print(f"Testing project {p.id}")
    user = db.query(models.User).filter(models.User.id == p.user_id).first()
    user_balance = None
    if user:
        tier = (p.tier or "").lower()
        if tier == "economy":
            user_balance = user.balance_economy
        elif tier == "professional":
            user_balance = user.balance_professional
        elif tier == "expert":
            user_balance = user.balance_expert
        else:
            user_balance = user.balance
            
    try:
        resp = ProjectResponse(
            id=p.id,
            user_id=p.user_id,
            name=p.name,
            status=p.status,
            plan_type=p.plan_type,
            tier=p.tier,
            settings=p.settings,
            daily_limit=p.daily_limit,
            total_target=p.total_target,
            hits_today=p.hits_today,
            total_hits=p.total_hits,
            start_at=p.start_at,
            created_at=p.created_at,
            expires_at=p.expires_at,
            priority=p.priority,
            force_stop_reason=p.force_stop_reason,
            is_hidden=p.is_hidden,
            internal_tags=p.internal_tags or [],
            notes=p.notes,
            is_flagged=p.is_flagged,
            user_email=user.email if user else None,
            user_name=user.name if user else None,
            user_balance=user_balance,
        )
        print(f"Project {p.id} OK")
    except Exception as e:
        print(f"Project {p.id} FAILED: {e}")
