# User Profile Implementation Plan

**Component**: `Profile.tsx`
**Route**: `/dashboard/profile`

## Purpose
Manages user account settings, security, and preferences.

## Features
*   [x] **Personal Info**: Name, Email, Phone.
*   [x] **Security**: Change password, 2FA toggle.
*   [x] **API Access**: API Key management for developers.
*   [x] **Notifications**: Email alert preferences.

## Planned Improvements
*   [x] **Login History**: Table showing recent login IPs and devices.
*   [x] **Avatar Upload**: Allow custom profile pictures.
*   [x] **Data Export**: GDPR compliant full data download.
*   [x] **Delete Account**: Self-serve account deletion flow (with confirmation).
*   [x] **Timezone Setting**: Adjust all dashboard timestamps to user preference.
*   [x] **Developer Mode**: Toggle to show raw JSON responses in dashboard.
*   [x] **API Key Regeneration**: One-click rotate secret key (with warning).
*   [x] **Theme Customizer**: Pick specific accent color for keyboard.
*   [x] **Language**: UI language preference (if multilingual).
*   [x] **Email Frequency**: "Daily digest" vs "Instant" alerts.
*   [x] **Public Profile**: Toggle to make profile public or private.
*   [ ] **Skills Badge**: "SEO Expert", "Traffic Master" badges based on usage.
*   [x] **Newsletter Sub**: Toggle to subscribe/unsubscribe from marketing emails.
*   [x] **Display Name**: "Show as [Nickname]" instead of real name.
*   [x] **Recovery Email**: Secondary email for emergency account access.
*   [x] **Session Kill**: "Log out everywhere else" button.
*   [ ] **Beta Tester**: Checkbox to opt-in to experimental features.
*   [ ] **Keyboard Shortcuts**: View list of all available shortcuts.
*   [x] **Referral Code**: Custom field to set vanity referral code.
*   [x] **Invoice Info**: Pre-fill Company Name/VAT for invoices.
*   [ ] **Onboarding Reset**: "Restart tour" button.
*   [x] **Color Blind Mode**: Accessibility toggle for high contrast.
*   [x] **Compact Mode**: "Reduce padding" toggle for denser UI.
*   [x] **Font Size**: "Small / Medium / Large" text preference.
*   [x] **API Whitelist**: Restrict API key usage to specific IPs.
*   [x] **Sound Effects**: Toggle UI clicks/notifications sounds.
*   [x] **Bio**: Short text bio for public profile.
*   [x] **Job Title**: "SEO Manager at [Company]" field.
*   [x] **Website**: Link to user's personal site.
*   [ ] **Team ID**: "Member of Team [Name]" indicator.
*   [x] **Role**: "Admin / Editor / Viewer" role display (if enterprise).
*   [x] **Audit Log**: "You changed password 3 days ago" timeline. (Verified via Login History)
*   [ ] **API Logs**: link to "View API usage history".
*   [x] **Webhook Secret**: View/Rotate webhook signing secret.
*   [x] **Accessibility**: "Reduce Motion" preference sync.
*   [ ] **Password Age**: "Last changed 3 months ago".
*   [x] **Login Notification**: "Email me on new login" toggle.

