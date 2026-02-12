# Admin Settings Implementation Plan

**Component**: `AdminSettings.tsx`
**Route**: `/admin/settings`

## Purpose
Configure platform-wide variables without redeploying.

## Features
*   [ ] **Global Config**: Default innovative traffic pricing, maintenance mode toggle.
*   [ ] **API Keys**: Manage third-party integrations (Stripe, Email Provider).
*   [ ] **System Limits**: Max projects per user, min deposit amount.

## Planned Improvements
*   [ ] **Change History**: Log of who changed what setting and when.
*   [ ] **Blacklist**: Manage banned IPs and Domains.
*   [ ] **Backup Controls**: Trigger manual database backup.
*   [ ] **SMTP Tester**: Button to send a test email to verify config.
*   [ ] **Logo Upload**: Change site logo from admin panel.
*   [ ] **Holiday Mode**: Display global banner "Support delayed for holidays".
*   [ ] **Bot User-Agents**: Textarea to update the list of UA strings used by bots.
*   [ ] **Proxy List**: Upload/Validate list of proxy servers.
*   [ ] **Theme CSS**: Inject custom CSS overrides from admin panel.
*   [ ] **Feature Flags**: Toggle beta features on/off globally.
*   [ ] **DB Vacuum**: Run database cleanup/optimization command.
*   [ ] **Cache Clear**: "Flush Redis Cache" button.
*   [ ] **Rate Limit Config**: Inputs to adjust API limits on the fly.
*   [ ] **Admin Whitelist**: Restrict admin panel access to specific IPs.
*   [ ] **Currency Rate**: Manually set or auto-sync USD to EUR rate.
*   [ ] **TOS Version**: Increment TOS version to force re-acceptance.
*   [ ] **Webhook URL**: Set global inbound webhook endpoint.
*   [ ] **Debug Level**: Toggle logging verbosity (Info/Debug/Trace).
*   [ ] **Maintenance Message**: Custom text input for maintenance screen.
*   [ ] **Max Sessions**: Limit concurrent logins per user.
*   [ ] **Password Policy**: Toggle complexity requirements strings.
*   [ ] **Email Template**: Editor for "Welcome" and "Reset Password" emails.
*   [ ] **Referral Settings**: Adjust commission % and cookie duration.
*   [ ] **SEO Meta Default**: Set default Title/Description for site.
*   [ ] **Social Links**: Update footer social links URLs.
*   [ ] **Contact Email**: Update support@ email address used across site.
*   [ ] **Favicon Upload**: Change favicon from admin.
*   [ ] **Robots.txt**: Editor for robots.txt content.
*   [ ] **Sitemap Gen**: Trigger manual sitemap regeneration.
*   [ ] **Cron Status**: View status of background scheduled tasks.
*   [ ] **Environment**: Read-only display of ENV variables (sanitized).
*   [ ] **Admin Users**: Invite new admin via email.
*   [ ] **Role Permissions**: "Support can only view tickets" checkbox matrix.
*   [ ] **2FA Enforcement**: "Require 2FA for all admins" toggle.
*   [ ] **Session Timeout**: Set admin session duration (e.g. 15 mins).
*   [ ] **Error Page Custom**: Text editor for 500 error page.
*   [ ] **Scripts Injection**: Header/Footer code injection (Analytics).
*   [ ] **Demo Data**: "Generate 50 fake users" button (dev only).
*   [ ] **Log Retention**: "Delete logs older than X days".
*   [ ] **Max Upload Size**: Limit file attachment size globally.
*   [ ] **Legal Text**: WYSIWYG editor for Privacy Policy content.
*   [ ] **System Health Check**: Button to run self-diagnosis of all services.
*   [ ] **License Key**: Field to enter Enterprise license key.
*   [ ] **Whitelabel**: Toggle to remove "Powered by" branding.
*   [ ] **Default Language**: Set default locale for new users.
*   [ ] **Tax Rates**: Table to set VAT rates per country.
*   [ ] **Payment Gateways**: toggle Stripe/PayPal on/off.
*   [ ] **Recaptcha Keys**: Inputs for site key and secret key.
*   [ ] **CDN URL**: Field to set asset CDN prefix.

