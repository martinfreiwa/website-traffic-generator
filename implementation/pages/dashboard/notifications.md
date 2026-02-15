# Notification Settings Implementation Plan

**Component**: `NotificationSettings.tsx`
**Route**: `/dashboard/notifications`

## Purpose
Gives users granular control over how and when they are contacted, reducing noise and ensuring critical alerts are never missed.

## Features
*   [ ] **Email Toggles**: On/Off switches for "Campaign Finished", "Low Credit Warning", "New Support Reply", "Affiliate Payout".
*   [ ] **Push Notifications**: Toggle for browser-native push alerts for real-time status updates.
*   [ ] **Frequency Control**: Choose between "Instant", "Daily Digest", or "Weekly Summary" for marketing news.
*   [ ] **SMS Alerts**: (Optional) Interface to add a phone number for emergency traffic drops.

## Planned Improvements
*   [ ] **Threshold Config**: Set custom "Low Credit" levels (e.g., notify me at 1k credits).
*   [ ] **Mute Mode**: Globally pause all notifications for a set duration.
*   [ ] **Sound Preferences**: Select different tones for different alert types in the dashboard.
*   [ ] **Slack/Webhook Direct**: Option to send all user notifications to a custom webhook URL.
*   [ ] **Language Settings**: Notification content matches user-selected UI language.
*   [ ] **Priority Filters**: "Only notify me for projects tagged 'High Priority'".

## Dependencies
*   `NotificationService` for dispatching.
*   `Firebase Cloud Messaging (FCM)` or similar for push.
