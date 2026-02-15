import os
import resend
from typing import Optional, List
from datetime import datetime

resend.api_key = os.getenv("RESEND_API_KEY", "")

FROM_EMAIL = "TrafficGen Pro <noreply@traffic-creator.com>"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://traffic-creator.com")


def get_from_email() -> str:
    return FROM_EMAIL


def get_frontend_url() -> str:
    return FRONTEND_URL


def send_email(
    to: str | List[str], subject: str, html: str, text: Optional[str] = None
) -> dict:
    try:
        params = {
            "from": get_from_email(),
            "to": to,
            "subject": subject,
            "html": html,
        }
        if text:
            params["text"] = text

        response = resend.Emails.send(params)
        return {"success": True, "data": response}
    except Exception as e:
        return {"success": False, "error": str(e)}


def send_verification_email(email: str, token: str) -> dict:
    frontend_url = get_frontend_url()
    verification_url = f"{frontend_url}/verify-email?token={token}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activate Your Account</title>
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
                            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -0.5px;">Welcome!</h1>
                            <p style="margin: 0 0 30px 0; font-size: 16px; font-weight: 500; color: #6B7280; line-height: 1.6;">
                                Thank you for signing up. Please confirm your email address to activate your account.
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <a href="{verification_url}" style="display: inline-block; background-color: #ff4d00; color: #FFFFFF; font-size: 14px; font-weight: 700; padding: 16px 32px; border-radius: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Confirm Email</a>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                                <tr>
                                    <td style="background-color: #F9FAFB; border-radius: 8px; padding: 20px;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Alternative Link</p>
                                        <p style="margin: 0; font-size: 13px; font-weight: 500; color: #6B7280; word-break: break-all; line-height: 1.5;">{verification_url}</p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 20px 0 0 0; font-size: 13px; font-weight: 500; color: #9CA3AF;">
                                This link expires in 24 hours.
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

    text = f"""Welcome to TrafficGen Pro!

Please confirm your email address with this link:
{verification_url}

This link expires in 24 hours.

Questions? Contact us at support@traffic-creator.com"""

    return send_email(
        to=email,
        subject="Activate Your TrafficGen Pro Account",
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


def send_welcome_email(email: str, name: str = "User") -> dict:
    frontend_url = get_frontend_url()
    display_name = name if name and name != "User" else email.split("@")[0]

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
                                        <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Your Next Steps</p>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #374151;">Create your first traffic project</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #374151;">Configure geo-targeting for specific countries</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #374151;">Choose from various traffic sources</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0;">
                                                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #374151;">Analyze your traffic statistics in real-time</p>
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
