# Admin User Management Implementation Plan

**Components**: `AdminUsers.tsx`, `AdminEditUser.tsx`
**Routes**: `/admin/users`, `/admin/users/:id`

## Purpose
Full control over user accounts.

## Features
*   [x] **User List**: Filter by joined date, status, email.
*   [x] **User Edit**:
    *   [x] Change password/email.
    *   [x] Add/Remove credits manually.
    *   [x] Ban/Suspend user.
    *   [x] View user's projects.
    *   [x] Impersonate user (Login as User).

## Planned Improvements
*   [ ] **Bulk Email**: Send announcements to selected users.
*   [ ] **Activity Logs**: Detailed timeline of user actions.
*   [x] **Notes**: Admin-only private notes field for each user.
*   [x] **Last IP**: Show the last known IP address in the user table.
*   [x] **Verification Status**: Toggle email verification manually.
*   [x] **Shadow Ban**: Allow user to use site but run no actual campaigns.
*   [ ] **Password Reset Link**: Generate a manual reset link to copy-paste.
*   [ ] **Referral Tree**: Visualize who referred this user.
*   [x] **Export Users**: Download user list as CSV.
*   [ ] **Import Users**: Bulk create users from CSV.
*   [x] **User Segments**: Create saved filters (e.g., "Whales", "Newbies").
*   [x] **Tagging**: Add multiple tags to users (e.g., "High Risk", "VIP").
*   [ ] **Risk Score**: Display fraud score from 3rd party tool.
*   [ ] **Session Manager**: View and kill specific active user sessions.
*   [x] **Plan Override**: Manually set user to "Pro" plan for free.
*   [ ] **Discount Override**: Set permanent distinct discount for user.
*   [x] **Credit History**: View log of every credit change (admin or system).
*   [x] **Login As**: "Magic Link" to login as user without password.
*   [ ] **Disable 2FA**: Emergency disable of 2FA if user locked out.
*   [ ] **Change Email**: Admin override to change user email.
*   [ ] **Merge Users**: Combine two accounts into one.
*   [ ] **Delete Data**: GDPR "Right to be forgotten" execution.
*   [ ] **Anonymize**: Scramble PII for testing/compliance.
*   [ ] **User Agent**: Show device info of last login.
*   [x] **Geo Location**: Show city/country of last login.
*   [ ] **Marketing Opt-in**: Toggle newsletter subscription status.
*   [ ] **API Keys**: View/Revoke user's API keys.
*   [ ] **Webhook Logs**: View webhooks sent to/from this user.
*   [x] **Project Count**: Column showing number of active projects.
*   [x] **Total Spend**: Column showing lifetime revenue from user.
*   [x] **Last Active**: Sort by last login date.
*   [ ] **Signup Source**: Show UTM source of registration.
*   [ ] **Referrer**: Show who referred this user.
*   [x] **Ban Reason**: Text field to explain why user was banned.
*   [ ] **Ban Duration**: Set temporary ban with auto-expire.
*   [ ] **Ticket History**: Link to user's support tickets.
*   [ ] **Transaction History**: Link to user's payments.
*   [ ] **KYC Status**: Verification level (if applicable).
*   [ ] **Custom Fields**: edit arbitrary JSON data attached to user profile.
*   [ ] **Waitlist**: Move user from waitlist to active.
*   [ ] **Invite Code**: Generate unique invite code for user.

