import asyncio
import logging
import random
from datetime import datetime, timedelta, date
from typing import Optional, Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database import SessionLocal
import models
from hit_emulator import ga_emu_engine
from email_service import send_email, get_frontend_url

logger = logging.getLogger(__name__)

TRAFFIC_PATTERN = {
    "weekday": [
        (0, 6, 0.1),
        (6, 9, 0.5),
        (9, 12, 0.9),
        (12, 14, 0.7),
        (14, 18, 1.0),
        (18, 22, 0.8),
        (22, 24, 0.1),
    ],
    "weekend_multiplier": 0.65,
}

FLUSH_INTERVAL_SECONDS = 300

consumption_buffer: Dict[str, Dict[str, int]] = {}
last_flush_time: datetime = datetime.utcnow() - timedelta(minutes=5)
last_daily_tx_date: Optional[date] = None


def calculate_traffic_multiplier(
    project_settings: dict, current_time: datetime
) -> float:
    pattern = project_settings.get("schedulePattern", "even")

    if pattern == "even":
        return 1.0

    hour = current_time.hour
    is_weekend = current_time.weekday() >= 5

    multiplier = 0.5
    for start_h, end_h, mult in TRAFFIC_PATTERN["weekday"]:
        if start_h <= hour < end_h:
            multiplier = mult
            break

    if is_weekend:
        multiplier *= TRAFFIC_PATTERN["weekend_multiplier"]

    return multiplier


def parse_schedule_date(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None

    try:
        if "T" in date_str:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        return None


def get_user_tier_balance(user, tier: str) -> float:
    tier = (tier or "economy").lower() if tier else "economy"
    balance_field = (
        f"balance_{tier}" if tier not in ("default", "economy") else "balance_economy"
    )
    return float(getattr(user, balance_field, 0) or 0)


def record_hit_in_buffer(project_id: str, tier: str):
    global consumption_buffer
    tier = (tier or "economy").lower() if tier else "economy"
    if tier in ("default",):
        tier = "economy"

    if project_id not in consumption_buffer:
        consumption_buffer[project_id] = {"economy": 0, "professional": 0, "expert": 0}

    if tier in consumption_buffer[project_id]:
        consumption_buffer[project_id][tier] += 1


def get_buffer_count(project_id: str, tier: str) -> int:
    tier = (tier or "economy").lower() if tier else "economy"
    if tier in ("default",):
        tier = "economy"

    if project_id not in consumption_buffer:
        return 0
    return consumption_buffer[project_id].get(tier, 0)


def reset_buffer(project_id: str, tier: str):
    global consumption_buffer
    tier = (tier or "economy").lower() if tier else "economy"
    if tier in ("default",):
        tier = "economy"

    if project_id in consumption_buffer and tier in consumption_buffer[project_id]:
        consumption_buffer[project_id][tier] = 0


def send_project_stopped_email(user_email: str, project_name: str, tier: str):
    tier_display = tier.capitalize() if tier else "Economy"
    dashboard_url = f"{get_frontend_url()}/dashboard/campaigns"
    buy_credits_url = f"{get_frontend_url()}/dashboard/buy-credits"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Stopped - Insufficient Balance</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAFA;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #ff4d00 0%, #ff6b35 100%); padding: 40px 40px 30px 40px; text-align: center;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <span style="font-size: 32px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">TRAFFIC</span>
                                        <span style="font-size: 10px; font-weight: 700; background-color: #000000; color: #FFFFFF; padding: 4px 8px; border-radius: 4px; margin-left: 8px; text-transform: uppercase; letter-spacing: 1px;">Creator</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 50px 40px;">
                            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -0.5px;">Project Stopped</h1>
                            <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 500; color: #6B7280; line-height: 1.6;">
                                Your campaign <strong>"{project_name}"</strong> has been stopped due to insufficient {tier_display} balance.
                            </p>
                            <p style="margin: 0 0 30px 0; font-size: 14px; font-weight: 500; color: #6B7280; line-height: 1.6;">
                                To continue receiving traffic, please add more credits to your account and restart the project from your dashboard.
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <a href="{buy_credits_url}" style="display: inline-block; background: linear-gradient(135deg, #ff4d00 0%, #ff6b35 100%); color: #FFFFFF; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">Buy Credits</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 30px 40px; border-top: 1px solid #E5E7EB;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <a href="{dashboard_url}" style="color: #6B7280; text-decoration: none; font-size: 13px; font-weight: 500;">Go to Dashboard</a>
                                        <span style="color: #D1D5DB; margin: 0 16px;">|</span>
                                        <a href="{get_frontend_url()}/support" style="color: #6B7280; text-decoration: none; font-size: 13px; font-weight: 500;">Contact Support</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

    send_email(
        to=user_email,
        subject=f"Project Stopped: {project_name} - Insufficient Balance",
        html=html,
        text=f"Your project '{project_name}' has been stopped due to insufficient {tier_display} balance. Visit {buy_credits_url} to buy more credits.",
    )


def flush_consumption():
    global consumption_buffer, last_flush_time

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        projects_to_stop = []

        for project_id, tier_counts in list(consumption_buffer.items()):
            project = (
                db.query(models.Project).filter(models.Project.id == project_id).first()
            )
            if not project:
                continue

            tier = (project.tier or "economy").lower() if project.tier else "economy"
            if tier in ("default",):
                tier = "economy"

            hits_to_deduct = tier_counts.get(tier, 0)
            if hits_to_deduct == 0:
                continue

            user = (
                db.query(models.User).filter(models.User.id == project.user_id).first()
            )
            if not user:
                continue

            balance_field = (
                f"balance_{tier}" if tier != "economy" else "balance_economy"
            )
            current_balance = float(getattr(user, balance_field, 0) or 0)

            new_balance = max(0, current_balance - hits_to_deduct)
            setattr(user, balance_field, new_balance)
            tier_counts[tier] = 0

            logger.info(
                f"Flush: Project {project_id} consumed {hits_to_deduct} hits from {tier} tier. Balance: {current_balance} -> {new_balance}"
            )

            if new_balance == 0 and project.status == "active":
                projects_to_stop.append((project, user, tier))

        for project, user, tier in projects_to_stop:
            project.status = "stopped"
            project.force_stop_reason = "Insufficient balance"
            logger.info(
                f"Project {project.id} stopped: insufficient balance for tier {tier}"
            )

            try:
                send_project_stopped_email(
                    user.email, project.name or project.id[:8], tier
                )
            except Exception as e:
                logger.error(f"Failed to send project stopped email: {e}")

        db.commit()
        last_flush_time = now

    except Exception as e:
        logger.error(f"Error flushing consumption: {e}")
        db.rollback()
    finally:
        db.close()


def create_daily_transactions():
    global last_daily_tx_date

    db = SessionLocal()
    try:
        today = datetime.utcnow().date()

        if last_daily_tx_date == today:
            return

        flush_consumption()

        yesterday = today - timedelta(days=1)
        yesterday_start = datetime.combine(yesterday, datetime.min.time())
        yesterday_end = datetime.combine(yesterday, datetime.max.time())

        logger.info(f"Creating daily transactions for {yesterday}")

        projects = db.query(models.Project).all()
        transactions_created = 0

        for project in projects:
            hits_yesterday = (
                db.query(models.TrafficLog)
                .filter(
                    and_(
                        models.TrafficLog.project_id == project.id,
                        models.TrafficLog.status == "success",
                        models.TrafficLog.event_type == "session_start",
                        models.TrafficLog.timestamp >= yesterday_start,
                        models.TrafficLog.timestamp <= yesterday_end,
                    )
                )
                .count()
            )

            if hits_yesterday > 0:
                tx = models.Transaction(
                    user_id=project.user_id,
                    type="debit",
                    hits=hits_yesterday,
                    tier=project.tier or "economy",
                    description=f"Traffic consumption - {yesterday}",
                    reference=project.id,
                    status="completed",
                )
                db.add(tx)
                transactions_created += 1
                logger.info(
                    f"Created debit transaction for project {project.id}: {hits_yesterday} hits"
                )

        if transactions_created > 0:
            db.commit()
            logger.info(
                f"Created {transactions_created} daily transactions for {yesterday}"
            )

        last_daily_tx_date = today

    except Exception as e:
        logger.error(f"Error creating daily transactions: {e}")
        db.rollback()
    finally:
        db.close()


def recover_buffer_from_trafficlog():
    global consumption_buffer, last_flush_time

    db = SessionLocal()
    try:
        recovery_start = last_flush_time
        logger.info(f"Recovering buffer from TrafficLog since {recovery_start}")

        hits_since_flush = (
            db.query(
                models.TrafficLog.project_id,
                func.count(models.TrafficLog.id).label("count"),
            )
            .filter(
                and_(
                    models.TrafficLog.status == "success",
                    models.TrafficLog.event_type == "session_start",
                    models.TrafficLog.timestamp >= recovery_start,
                )
            )
            .group_by(models.TrafficLog.project_id)
            .all()
        )

        for hit in hits_since_flush:
            project_id = str(hit.project_id)
            project = (
                db.query(models.Project).filter(models.Project.id == project_id).first()
            )
            if project:
                tier = (
                    (project.tier or "economy").lower() if project.tier else "economy"
                )
                if tier in ("default",):
                    tier = "economy"
                for _ in range(hit.count):
                    record_hit_in_buffer(project_id, tier)

        logger.info(
            f"Recovered {len(hits_since_flush)} project buffers from TrafficLog"
        )

    except Exception as e:
        logger.error(f"Error recovering buffer: {e}")
    finally:
        db.close()


def save_flush_timestamp():
    pass


def save_flush_timestamp():
    pass


class TrafficScheduler:
    def __init__(self):
        self.is_running = False
        self._task = None
        self._flush_task = None
        self._daily_task = None
        self._flush_counter = 0

    async def start(self):
        if self.is_running:
            return
        self.is_running = True

        recover_buffer_from_trafficlog()

        self._task = asyncio.create_task(self._loop())
        self._flush_task = asyncio.create_task(self._flush_loop())
        logger.info("SaaS Traffic Scheduler started with consumption tracking")

    async def stop(self):
        self.is_running = False
        flush_consumption()
        save_flush_timestamp()

        for task in [self._task, self._flush_task, self._daily_task]:
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        logger.info("SaaS Traffic Scheduler stopped")

    async def _flush_loop(self):
        while self.is_running:
            try:
                await asyncio.sleep(FLUSH_INTERVAL_SECONDS)
                flush_consumption()
                save_flush_timestamp()
                logger.debug("Consumption buffer flushed")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in flush loop: {e}")

    async def _loop(self):
        while self.is_running:
            try:
                await self.check_and_run()

                now = datetime.utcnow()
                if now.hour == 0 and now.minute < 2:
                    create_daily_transactions()

                if now.hour == 3 and now.minute < 2:
                    run_daily_fraud_check()

            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
            await asyncio.sleep(60)

    async def check_and_run(self):
        db = SessionLocal()
        try:
            now = datetime.utcnow()

            if now.hour == 0 and now.minute == 0:
                db.query(models.Project).update({models.Project.hits_today: 0})
                db.commit()
                logger.info("Daily project hits reset to zero")

            active_projects = (
                db.query(models.Project).filter(models.Project.status == "active").all()
            )

            for project in active_projects:
                user = (
                    db.query(models.User)
                    .filter(models.User.id == project.user_id)
                    .first()
                )
                if not user:
                    continue

                tier = project.tier or "economy"
                balance = get_user_tier_balance(user, tier)
                buffer_count = get_buffer_count(project.id, tier)

                if balance <= buffer_count:
                    project.status = "stopped"
                    project.force_stop_reason = "Insufficient balance"
                    db.commit()
                    logger.info(
                        f"Project {project.id} paused: no balance for tier {tier} (balance={balance}, pending={buffer_count})"
                    )

                    try:
                        send_project_stopped_email(
                            user.email, project.name or project.id[:8], tier
                        )
                    except Exception as e:
                        logger.error(f"Failed to send project stopped email: {e}")
                    continue

                settings = project.settings or {}

                schedule_start = settings.get("scheduleStart")
                schedule_end = settings.get("scheduleEnd")

                if schedule_start:
                    start_dt = parse_schedule_date(schedule_start)
                    if start_dt and now < start_dt:
                        logger.debug(
                            f"Project {project.id} not started yet (scheduled for {schedule_start})"
                        )
                        continue

                if schedule_end:
                    end_dt = parse_schedule_date(schedule_end)
                    if end_dt and now > end_dt:
                        project.status = "completed"
                        db.commit()
                        logger.info(f"Project {project.id} completed: schedule ended")
                        continue

                multiplier = calculate_traffic_multiplier(settings, now)

                if multiplier < 0.1:
                    logger.debug(
                        f"Project {project.id} skipping: low traffic period (multiplier={multiplier:.2f})"
                    )
                    continue

                if (
                    project.daily_limit > 0
                    and project.hits_today >= project.daily_limit
                ):
                    logger.debug(
                        f"Project {project.id} reached daily limit: {project.hits_today}/{project.daily_limit}"
                    )
                    continue

                if (
                    project.total_target > 0
                    and project.total_hits >= project.total_target
                ):
                    project.status = "completed"
                    db.commit()
                    logger.info(
                        f"Project {project.id} reached total target: {project.total_hits}/{project.total_target}"
                    )
                    continue

                asyncio.create_task(ga_emu_engine.run_for_project(project.id))

        except Exception as e:
            logger.error(f"Scheduler check failed: {e}")
        finally:
            db.close()


scheduler = TrafficScheduler()


fraud_alerts_cache: List[Dict[str, Any]] = []
last_fraud_check: Optional[datetime] = None


def run_daily_fraud_check():
    global fraud_alerts_cache, last_fraud_check

    db = SessionLocal()
    try:
        logger.info("Running daily fraud detection check...")

        ip_groups = (
            db.query(models.User.last_ip, func.count(models.User.id).label("count"))
            .filter(models.User.last_ip != None, models.User.last_ip != "")
            .group_by(models.User.last_ip)
            .having(func.count(models.User.id) >= 2)
            .all()
        )

        alerts = []

        for ip_group in ip_groups:
            ip = ip_group.last_ip
            users = db.query(models.User).filter(models.User.last_ip == ip).all()

            user_ids = [u.id for u in users]
            user_emails = [u.email for u in users]

            total_affiliate_earnings = 0.0
            for u in users:
                tier = (
                    db.query(models.AffiliateTier)
                    .filter(models.AffiliateTier.user_id == u.id)
                    .first()
                )
                if tier:
                    total_affiliate_earnings += float(tier.total_earnings or 0)

            has_affiliate_relation = False
            for user_id in user_ids:
                relations = (
                    db.query(models.AffiliateRelation)
                    .filter(
                        (models.AffiliateRelation.user_id == user_id)
                        | (models.AffiliateRelation.referrer_l1_id == user_id)
                        | (models.AffiliateRelation.referrer_l2_id == user_id)
                        | (models.AffiliateRelation.referrer_l3_id == user_id)
                    )
                    .all()
                )

                for rel in relations:
                    other_ids = [
                        rel.user_id,
                        rel.referrer_l1_id,
                        rel.referrer_l2_id,
                        rel.referrer_l3_id,
                    ]
                    for other_id in other_ids:
                        if other_id and other_id in user_ids and other_id != user_id:
                            has_affiliate_relation = True
                            break
                    if has_affiliate_relation:
                        break
                if has_affiliate_relation:
                    break

            risk_level = "low"
            if has_affiliate_relation and total_affiliate_earnings > 0:
                risk_level = "high"
            elif total_affiliate_earnings > 0:
                risk_level = "medium"
            elif len(users) >= 3:
                risk_level = "medium"

            alerts.append(
                {
                    "id": f"ip_{ip}",
                    "type": "ip_sharing",
                    "ip": ip,
                    "user_ids": user_ids,
                    "user_emails": user_emails,
                    "affiliate_earnings": total_affiliate_earnings,
                    "has_affiliate_relation": has_affiliate_relation,
                    "detected_at": datetime.utcnow().isoformat(),
                    "risk_level": risk_level,
                }
            )

        fraud_alerts_cache = alerts
        last_fraud_check = datetime.utcnow()

        high_risk_count = len([a for a in alerts if a["risk_level"] == "high"])
        logger.info(
            f"Fraud check complete: {len(alerts)} IP groups found, {high_risk_count} high risk"
        )

    except Exception as e:
        logger.error(f"Error in daily fraud check: {e}")
    finally:
        db.close()


def get_cached_fraud_alerts() -> List[Dict[str, Any]]:
    global fraud_alerts_cache, last_fraud_check

    if not fraud_alerts_cache or not last_fraud_check:
        run_daily_fraud_check()
    elif (datetime.utcnow() - last_fraud_check).total_seconds() > 86400:
        run_daily_fraud_check()

    return fraud_alerts_cache
