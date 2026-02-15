# Security & Activity Logs Implementation Plan

**Component**: `SecuritySettings.tsx`
**Route**: `/dashboard/security`

## Purpose
Builds user trust and transparency by providing tools to secure their account and monitor sensitive activity.

## Features
*   [ ] **Login History**: Table showing last 20 logins with Date, IP Address, Device, and Location.
*   [ ] **Active Sessions Management**: List of all devices currently logged in with a "Logout All Other Sessions" button.
*   [ ] **Two-Factor Authentication (2FA)**: Setup flow for Authenticator apps (TOTP).
*   [ ] **Audit Log**: Searchable history of critical actions (e.g., Password change, API key deletion, Campaign creation).
*   [ ] **Password Management**: Integrated form for updating account credentials.

## Planned Improvements
*   [ ] **Email Login Alerts**: Option to receive an email whenever a new device logs in.
*   [ ] **Recovery Codes**: Generate and download static codes for 2FA bypass.
*   [ ] **Session Duration**: Configure automatic logout after X hours of inactivity.
*   [ ] **Security Score**: A visual meter showing account "Health" based on 2FA and password strength.
*   [ ] **IP Blocking**: Manually block certain IPs from accessing the account.
*   [ ] **Biometric Options**: Support for WebAuthn (Passkeys/TouchID) where available.
*   [ ] **Data Export**: Bundle all security logs into a ZIP file for compliance.
*   [ ] **Unusual Activity Detection**: Highlight login attempts from high-risk locations in red.
*   [ ] **Privacy Mode**: Toggle to blur sensitive data (like full IP addresses) in logs.

## Dependencies
*   `speakeasy` or similar for TOTP.
*   `qrcode.react` for 2FA setup.
*   `ActivityLogService` for backend data.
