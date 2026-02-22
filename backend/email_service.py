import os
import resend
import logging
from typing import Optional, List, Union
from datetime import datetime
from database import SessionLocal
import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

resend.api_key = os.getenv("RESEND_API_KEY", "")

FROM_EMAIL = "TrafficGen Pro <noreply@traffic-creator.com>"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://traffic-creator.com")


def get_from_email() -> str:
    return FROM_EMAIL


def get_frontend_url() -> str:
    return FRONTEND_URL


def send_email(
    to: Union[str, List[str]], subject: str, html: str, text: Optional[str] = None
) -> dict:
    to_list = to if isinstance(to, list) else [to]
    email_count = len(to_list)

    db = SessionLocal()
    try:
        today_start = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        try:
            emails_sent_today = (
                db.query(models.EmailLog)
                .filter(models.EmailLog.sent_at >= today_start)
                .count()
            )
        except Exception:
            emails_sent_today = 0

        if emails_sent_today + email_count > 100:
            logger.warning(
                f"⚠️ Daily email limit (100) reached. Sent today: {emails_sent_today}. Cannot send {email_count} more emails."
            )
            return {
                "success": False,
                "error": "Daily email limit reached (max 100 emails/day).",
            }

        logger.info(f"📧 Attempting to send {email_count} email(s), subject: {subject}")

        # Resend allows max 50 recipients per API call, so we chunk them
        chunk_size = 50
        all_responses = []

        for i in range(0, len(to_list), chunk_size):
            chunk = to_list[i : i + chunk_size]
            params = {
                "from": get_from_email(),
                "to": chunk,
                "subject": subject,
                "html": html,
            }
            if text:
                params["text"] = text

            response = resend.Emails.send(params)
            all_responses.append(response)

            logger.info(
                f"✅ Email chunk sent successfully! ID: {response.get('id', 'unknown')}, chunk size: {len(chunk)}"
            )

            try:
                for recipient in chunk:
                    log_entry = models.EmailLog(
                        email_type="transactional",
                        to_email=recipient,
                        subject=subject,
                        status="sent",
                        sent_at=datetime.utcnow(),
                    )
                    db.add(log_entry)
                db.commit()
            except Exception as log_err:
                logger.warning(f"Failed to log email to database: {log_err}")

        return {
            "success": True,
            "data": all_responses if len(all_responses) > 1 else all_responses[0],
        }

    except Exception as e:
        logger.error(
            f"❌ Email FAILED to send! to: {to}, subject: {subject}, error: {str(e)}"
        )

        for recipient in to_list:
            log_entry = models.EmailLog(
                email_type="transactional",
                to_email=recipient,
                subject=subject,
                status="failed",
                error_message=str(e),
                sent_at=datetime.utcnow(),
            )
            try:
                db.add(log_entry)
                db.commit()
            except Exception as db_e:
                logger.error(f"Failed to log email error: {db_e}")

        return {"success": False, "error": str(e)}
    finally:
        db.close()


def send_verification_email(email: str, code: str) -> dict:
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
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
                            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -0.5px;">Verify Your Email</h1>
                            <p style="margin: 0 0 30px 0; font-size: 16px; font-weight: 500; color: #6B7280; line-height: 1.6;">
                                Enter this verification code in your dashboard to activate your account:
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <div style="display: inline-block; background-color: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 12px; padding: 20px 40px;">
                                            <span style="font-size: 48px; font-weight: 900; color: #111827; letter-spacing: 12px; font-family: 'SF Mono', 'Consolas', monospace;">{code}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 30px 0 0 0; font-size: 13px; font-weight: 500; color: #9CA3AF;">
                                This code expires in 24 hours.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 30px 40px; border-top: 1px solid #E5E7EB;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: #6B7280;">
                                            Questions? Contact us at <a href="mailto:support@traffic-creator.com" style="color: #ff4d00; text-decoration: none;">support@traffic-creator.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; font-weight: 500; color: #9CA3AF;">
                                            © 2026 TrafficGen Pro. All rights reserved.
                                        </p>
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

    text = f"""Verify Your Email

Your verification code is: {code}

Enter this code in your dashboard to activate your account.
This code expires in 24 hours.

Questions? Contact us at support@traffic-creator.com"""

    return send_email(
        to=email,
        subject="Your Verification Code - TrafficGen Pro",
        html=html,
        text=text,
    )


def send_password_reset_email(email: str, token: str) -> dict:
    frontend_url = get_frontend_url()
    reset_url = f"{frontend_url}/reset-password?token={token}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAFA;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="background-color: #111827; padding: 40px 40px 30px 40px; text-align: center;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <span style="font-size: 32px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">TRAFFIC</span>
                                        <span style="font-size: 10px; font-weight: 700; background-color: #ff4d00; color: #FFFFFF; padding: 4px 8px; border-radius: 4px; margin-left: 8px; text-transform: uppercase; letter-spacing: 1px;">Creator</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 50px 40px;">
                            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -0.5px;">Reset Password</h1>
                            <p style="margin: 0 0 30px 0; font-size: 16px; font-weight: 500; color: #6B7280; line-height: 1.6;">
                                You requested to reset your password. Click the button below to create a new password.
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <a href="{reset_url}" style="display: inline-block; background-color: #ff4d00; color: #FFFFFF; font-size: 14px; font-weight: 700; padding: 16px 32px; border-radius: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                                <tr>
                                    <td style="background-color: #F9FAFB; border-radius: 8px; padding: 20px;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Alternative Link</p>
                                        <p style="margin: 0; font-size: 13px; font-weight: 500; color: #6B7280; word-break: break-all; line-height: 1.5;">{reset_url}</p>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                                <tr>
                                    <td style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px; padding: 16px;">
                                        <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400E; line-height: 1.5;">
                                            Important: This link is only valid for 1 hour. If you did not request this, you can ignore this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 30px 40px; border-top: 1px solid #E5E7EB;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: #6B7280;">
                                            Questions? Contact us at <a href="mailto:support@traffic-creator.com" style="color: #ff4d00; text-decoration: none;">support@traffic-creator.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; font-weight: 500; color: #9CA3AF;">
                                            © 2026 TrafficGen Pro. All rights reserved.
                                        </p>
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

    text = f"""Reset Your Password

You requested to reset your password.

Link: {reset_url}

This link is only valid for 1 hour. If you did not request this, you can ignore this email.

Questions? Contact us at support@traffic-creator.com"""

    return send_email(
        to=email,
        subject="Reset Your Password - TrafficGen Pro",
        html=html,
        text=text,
    )


def send_welcome_email(email: str, name: str = "User", password: str = None) -> dict:
    frontend_url = get_frontend_url()
    display_name = name if name and name != "User" else email.split("@")[0]
    password_section = ""

    if password:
        password_section = f"""
                                        <tr>
                                            <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                                                <p style="margin: 0; font-size: 14px; font-weight: 500; color: #374151;">Password: <strong style="color: #ff4d00;">{password}</strong></p>
                                            </td>
                                        </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TrafficGen Pro</title>
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
                            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -0.5px;">Welcome, {display_name}!</h1>
                            <p style="margin: 0 0 30px 0; font-size: 16px; font-weight: 500; color: #6B7280; line-height: 1.6;">
                                Your account is now activated. We're glad to have you on board!
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="background-color: #F9FAFB; border-radius: 12px; padding: 24px;">
                                        <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Your Account Details</p>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #374151;">Email: <strong>{email}</strong></p>
                                                </td>
                                            </tr>
                                            {password_section}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <a href="{frontend_url}/dashboard" style="display: inline-block; background-color: #ff4d00; color: #FFFFFF; font-size: 14px; font-weight: 700; padding: 16px 32px; border-radius: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Go to Dashboard</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 30px 40px; border-top: 1px solid #E5E7EB;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: #6B7280;">
                                            Questions? Contact us at <a href="mailto:support@traffic-creator.com" style="color: #ff4d00; text-decoration: none;">support@traffic-creator.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; font-weight: 500; color: #9CA3AF;">
                                            © 2026 TrafficGen Pro. All rights reserved.
                                        </p>
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

    text = f"""Welcome to TrafficGen Pro, {display_name}!

Your account is now activated.

Your Next Steps:
- Create your first traffic project
- Configure geo-targeting for specific countries
- Choose from various traffic sources
- Analyze your traffic statistics in real-time

Go to Dashboard: {frontend_url}/dashboard

Questions? Contact us at support@traffic-creator.com"""

    return send_email(
        to=email,
        subject="Welcome to TrafficGen Pro - Account Activated!",
        html=html,
        text=text,
    )


def send_payment_receipt_email(
    email: str, amount: float, plan: str, transaction_id: str
) -> dict:
    frontend_url = get_frontend_url()

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
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
                            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -0.5px;">Payment Successful!</h1>
                            <p style="margin: 0 0 30px 0; font-size: 16px; font-weight: 500; color: #6B7280; line-height: 1.6;">
                                Thank you for your purchase at TrafficGen Pro.
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="background-color: #F9FAFB; border-radius: 12px; padding: 24px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="font-size: 14px; font-weight: 500; color: #6B7280;">Plan</td>
                                                            <td align="right" style="font-size: 14px; font-weight: 600; color: #111827;">{plan}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="font-size: 14px; font-weight: 500; color: #6B7280;">Amount</td>
                                                            <td align="right" style="font-size: 14px; font-weight: 600; color: #111827;">EUR {amount:.2f}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="font-size: 14px; font-weight: 500; color: #6B7280;">Transaction ID</td>
                                                            <td align="right" style="font-size: 14px; font-weight: 600; color: #111827; font-family: monospace;">{transaction_id}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="font-size: 14px; font-weight: 500; color: #6B7280;">Date</td>
                                                            <td align="right" style="font-size: 14px; font-weight: 600; color: #111827;">{datetime.now().strftime("%d.%m.%Y")}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <a href="{frontend_url}/dashboard" style="display: inline-block; background-color: #ff4d00; color: #FFFFFF; font-size: 14px; font-weight: 700; padding: 16px 32px; border-radius: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Go to Dashboard</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 30px 40px; border-top: 1px solid #E5E7EB;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: #6B7280;">
                                            Questions? Contact us at <a href="mailto:support@traffic-creator.com" style="color: #ff4d00; text-decoration: none;">support@traffic-creator.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; font-weight: 500; color: #9CA3AF;">
                                            © 2026 TrafficGen Pro. All rights reserved.
                                        </p>
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

    text = f"""Payment Confirmation

Thank you for your purchase at TrafficGen Pro.

Plan: {plan}
Amount: EUR {amount:.2f}
Transaction ID: {transaction_id}
Date: {datetime.now().strftime("%d.%m.%Y")}

Go to Dashboard: {frontend_url}/dashboard

Questions? Contact us at support@traffic-creator.com"""

    return send_email(
        to=email,
        subject=f"Payment Confirmation - {plan}",
        html=html,
        text=text,
    )
