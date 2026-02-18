import logging
from datetime import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING
from database import SessionLocal
import models

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def log_activity(
    user_id: Optional[str],
    action_type: str,
    action_detail: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> models.ActivityLog:
    """
    Log a user activity to the activity_log table.
    """
    db = SessionLocal()
    try:
        activity = models.ActivityLog(
            user_id=user_id,
            action_type=action_type,
            action_detail=action_detail or {},
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow(),
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)
        return activity
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")
        db.rollback()
        return None
    finally:
        db.close()


def create_session(
    user_id: str,
    token: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    device_info: Optional[Dict[str, Any]] = None,
    location: Optional[str] = None,
) -> models.UserSession:
    """
    Create a new user session.
    """
    db = SessionLocal()
    try:
        from jose import jwt

        SECRET_KEY = "your-secret-key-change-this-in-prod"

        # Decode token to get expiration
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            exp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp) if exp else None
        except:
            from datetime import timedelta

            expires_at = datetime.utcnow() + timedelta(minutes=3000)

        session = models.UserSession(
            user_id=user_id,
            token_hash=token[:20]
            if token
            else None,  # Store partial hash for reference
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info or {},
            location=location,
            expires_at=expires_at,
            is_active=True,
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        db.rollback()
        return None
    finally:
        db.close()


def update_session_activity(session_id: str) -> bool:
    """
    Update the last activity timestamp for a session.
    """
    db = SessionLocal()
    try:
        session = (
            db.query(models.UserSession)
            .filter(models.UserSession.id == session_id)
            .first()
        )
        if session:
            session.last_activity = datetime.utcnow()
            db.commit()
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to update session activity: {e}")
        return False
    finally:
        db.close()


def terminate_session(session_id: str, reason: str = "manual") -> bool:
    """
    Terminate a user session (set is_active to False).
    """
    db = SessionLocal()
    try:
        session = (
            db.query(models.UserSession)
            .filter(models.UserSession.id == session_id)
            .first()
        )
        if session:
            session.is_active = False
            db.commit()

            # Also blacklist the token if we have it stored
            if session.token_hash:
                blacklist_token(session.token_hash + "...", session.user_id, reason)

            return True
        return False
    except Exception as e:
        logger.error(f"Failed to terminate session: {e}")
        return False
    finally:
        db.close()


def get_user_sessions(user_id: str) -> list:
    """
    Get all active sessions for a user.
    """
    db = SessionLocal()
    try:
        sessions = (
            db.query(models.UserSession)
            .filter(
                models.UserSession.user_id == user_id,
                models.UserSession.is_active == True,
            )
            .order_by(models.UserSession.last_activity.desc())
            .all()
        )
        return sessions
    except Exception as e:
        logger.error(f"Failed to get user sessions: {e}")
        return []
    finally:
        db.close()


def blacklist_token(token: str, user_id: Optional[str], reason: str = "logout") -> bool:
    """
    Add a token to the blacklist to prevent its use.
    """
    db = SessionLocal()
    try:
        from jose import jwt

        SECRET_KEY = "your-secret-key-change-this-in-prod"

        # Try to decode token to get expiration
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            exp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp) if exp else None
        except:
            from datetime import timedelta

            expires_at = datetime.utcnow() + timedelta(minutes=3000)

        blacklist_entry = models.TokenBlacklist(
            token=token[:100] if len(token) > 100 else token,  # Truncate if too long
            user_id=user_id,
            reason=reason,
            expires_at=expires_at,
            blacklisted_at=datetime.utcnow(),
        )
        db.add(blacklist_entry)
        db.commit()
        return True
    except Exception as e:
        logger.error(f"Failed to blacklist token: {e}")
        return False
    finally:
        db.close()


def is_token_blacklisted(token: str) -> bool:
    """
    Check if a token is blacklisted.
    """
    db = SessionLocal()
    try:
        # Clean up expired entries first
        db.query(models.TokenBlacklist).filter(
            models.TokenBlacklist.expires_at < datetime.utcnow()
        ).delete()
        db.commit()

        # Check if token is blacklisted
        entry = (
            db.query(models.TokenBlacklist)
            .filter(models.TokenBlacklist.token == token)
            .first()
        )
        return entry is not None
    except Exception as e:
        logger.error(f"Failed to check token blacklist: {e}")
        return False
    finally:
        db.close()


def log_impersonation(
    admin_id: str, target_user_id: str, action: str, ip_address: Optional[str] = None
) -> models.ImpersonationLog:
    """
    Log an impersonation action (admin logging in as user).
    """
    db = SessionLocal()
    try:
        log = models.ImpersonationLog(
            admin_id=admin_id,
            target_user_id=target_user_id,
            action=action,
            ip_address=ip_address,
            created_at=datetime.utcnow(),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        logger.error(f"Failed to log impersonation: {e}")
        db.rollback()
        return None
    finally:
        db.close()


def log_balance_adjustment(
    user_id: str,
    admin_id: Optional[str],
    adjustment_type: str,
    tier: str,
    amount: float,
    hits: Optional[int],
    reason: str,
    notes: Optional[str] = None,
    db: Optional["Session"] = None,
) -> models.BalanceAdjustmentLog:
    """
    Log a balance adjustment made by an admin.
    """
    own_session = db is None
    if own_session:
        db = SessionLocal()
    try:
        log = models.BalanceAdjustmentLog(
            user_id=user_id,
            admin_id=admin_id,
            adjustment_type=adjustment_type,
            tier=tier,
            amount=amount,
            hits=hits,
            reason=reason,
            notes=notes,
            created_at=datetime.utcnow(),
        )
        db.add(log)
        if own_session:
            db.commit()
            db.refresh(log)
        return log
    except Exception as e:
        logger.error(f"Failed to log balance adjustment: {e}")
        if own_session:
            db.rollback()
        return None
    finally:
        if own_session:
            db.close()


def log_email(
    user_id: Optional[str],
    email_type: str,
    to_email: str,
    subject: Optional[str] = None,
    status: str = "sent",
    error_message: Optional[str] = None,
    db: Optional["Session"] = None,
) -> models.EmailLog:
    """
    Log an email sent to a user.
    """
    own_session = db is None
    if own_session:
        db = SessionLocal()
    try:
        log = models.EmailLog(
            user_id=user_id,
            email_type=email_type,
            to_email=to_email,
            subject=subject,
            status=status,
            error_message=error_message,
            sent_at=datetime.utcnow(),
        )
        db.add(log)
        if own_session:
            db.commit()
            db.refresh(log)
        return log
    except Exception as e:
        logger.error(f"Failed to log email: {e}")
        if own_session:
            db.rollback()
        return None
    finally:
        if own_session:
            db.close()


def get_or_create_notification_prefs(user_id: str) -> models.UserNotificationPrefs:
    """
    Get or create notification preferences for a user.
    """
    db = SessionLocal()
    try:
        prefs = (
            db.query(models.UserNotificationPrefs)
            .filter(models.UserNotificationPrefs.user_id == user_id)
            .first()
        )

        if not prefs:
            prefs = models.UserNotificationPrefs(
                user_id=user_id,
                email_marketing=True,
                email_transactional=True,
                email_alerts=True,
                browser_notifications=True,
                newsletter_sub=False,
                email_frequency="instant",
                updated_at=datetime.utcnow(),
            )
            db.add(prefs)
            db.commit()
            db.refresh(prefs)

        return prefs
    except Exception as e:
        logger.error(f"Failed to get notification prefs: {e}")
        return None
    finally:
        db.close()
