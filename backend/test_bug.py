import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
from admin_utils import get_or_create_notification_prefs
from sqlalchemy import func
import traceback

def test():
    db = SessionLocal()
    user_id = "d0067967-bd4b-4443-92f5-a31996cd1383"
    try:
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_user:
            print("User not found by SQLAlchemy logic!")
            return
            
        print(f"Found user: {db_user.email}")
        
        credit_transactions = db.query(models.Transaction).filter(models.Transaction.user_id == user_id, models.Transaction.type == "credit").all()
        debit_transactions = db.query(models.Transaction).filter(models.Transaction.user_id == user_id, models.Transaction.type == "debit").all()

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

        transactions_count = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).count()
        projects_count = db.query(models.Project).filter(models.Project.user_id == user_id).count()
        tickets_count = db.query(models.Ticket).filter(models.Ticket.user_id == user_id).count()
        referrals_count = db.query(models.User).filter(models.User.referred_by == user_id).count()
        referral_earnings = db.query(func.sum(models.AffiliateEarning.amount)).filter(models.AffiliateEarning.referrer_id == user_id).scalar() or 0
        
        notification_prefs = get_or_create_notification_prefs(user_id)
        
        from main import get_user_details_admin
        print("Everything up to UserResponse creation worked!")
        
        from main import UserResponse
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
            login_history=db_user.login_history or [],
        )
        print("UserResponse created successfully.")
    except Exception as e:
        traceback.print_exc()

test()
