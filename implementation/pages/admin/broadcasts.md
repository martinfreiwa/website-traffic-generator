# Admin Broadcasts & Announcements Implementation Plan

**Component**: `AdminBroadcasts.tsx`
**Route**: `/admin/broadcasts`

## Purpose
System-wide communication tool to alert users about maintenance, features, or issues.

## Features
*   [x] **Create Broadcast**: WYSIWYG editor for announcement content.
*   [x] **Targeting**: Send to "All Users", "Active Projects", or "Free Tier".
*   [x] **Scheduling**: Set start and end times for banner visibility.

## Planned Improvements
### Core Functionality (Must Have)
*   [x] **Banner Types**: Select style (Info, Warning, Critical, Success).
*   [ ] **Placement**: Top Valid (Global), Dashboard Only, or Modal Popup.
*   [ ] **Rich Text Editor**: Bold, Italics, Lists, and Emoji support in message body.
*   [x] **Dismissible**: Toggle if users can close the banner permanently.
*   [x] **Action Button**: Add a CTA button (e.g., "Update Now", "Read Blog").
*   [ ] **Draft Mode**: Preview how the banner looks on the live site.
*   [ ] **Priority Level**: If multiple broadcasts exist, which one shows on top?
*   [x] **Expiry Auto-Delete**: Archive broadcasts automatically after end date.
*   [x] **Copy Previous**: "Duplicate" button to clone an old broadcast.
*   [ ] **Link Validation**: Auto-check that CTA links are not broken (404 check).
*   [x] **Mobile Responsive**: Ensure banners stack correctly on small screens.
*   [ ] **Global Kill Switch**: One-click button to hide all active broadcasts instantly.
*   [x] **Character Limit**: Input counter to prevent UI-breaking long messages.
*   [ ] **Sanitization**: Auto-strip unsafe HTML/JS to prevent XSS attacks.

### Advanced Targeting (Growth)
*   [ ] **Plan Targeting**: "Show only to Enterprise Plan users".
*   [ ] **Geo Targeting**: Show only to users in specific countries.
*   [ ] **Device Targeting**: "Show only to Mobile users" or "Chrome users".
*   [ ] **Version Targeting**: Show only to users on specific API versions.
*   [ ] **Cohort Targeting**: "Show to users who joined > 1 year ago" (Anniversary).
*   [ ] **Behavioral Trigger**: Show banner when user visits `/settings/billing`.
*   [ ] **Timezone Respect**: "Show at 9 AM user's local time".
*   [ ] **Frequency Cap**: "Show max 3 times per user".

### Analytics & Engagement
*   [ ] **Interaction Stats**: Track views and clicks on the announcement.
*   [ ] **Conversion Tracking**: Did the user do the action? (e.g. "Upgraded Plan").
*   [ ] **A/B Testing**: Test two different headlines to see which gets more clicks.
*   [ ] **Deep Link**: Open specific app modal (e.g. "Open Deposit Modal") on click.
*   [ ] **Email Sync**: improved option to also send broadcast as email newsletter.
*   [ ] **Feedback Poll**: Tiny "Was this helpful?" thumbs up/down in the banner.
*   [ ] **User History**: Admin view of which broadcasts a specific user has seen.

### Dev & Ops (Efficiency)
*   [ ] **Emergency Override**: "Take over screen" mode for critical security alerts.
*   [ ] **API Trigger**: Trigger a broadcast via API (e.g. from monitoring system).
*   [ ] **Recurring**: set a repeating schedule (e.g., "Maintenance every Sunday").
*   [ ] **Templates**: Save common alerts (e.g., "Downtime Resolved") as templates.
*   [ ] **Schedule Conflict**: Warn if another broadcast is already scheduled for that time.
*   [ ] **Audience Size Estimate**: "This will reach ~1,420 users" calculator.
*   [ ] **Approval Workflow**: Require "Head of Product" approval before going live.
*   [ ] **RSS Feed**: Auto-generate an RSS item for the "Status Page".

### Advanced / UI Delight
*   [ ] **Dynamic Variables**: "Hello {user.first_name}, check this out!".
*   [ ] **Multi-Language**: Define different text for EN, DE, FR users.
*   [ ] **Countdown Timer**: Embed a live countdown clock (e.g., for scheduled maintenance).
*   [ ] **Snooze Function**: Allow user to "Remind me later".
*   [ ] **Dark Mode Preview**: Check how it looks in dark vs light mode.
*   [ ] **Confetti**: 🎉 Animation on load (for celebratory news).
*   [ ] **Sound Effect**: Optional generic "ping" sound (use sparingly!).
*   [ ] **CSS Injection**: Allow custom styling per broadcast (advanced).

### Seasonal Campaign Planning (New)
*   [ ] **Visual Calendar**: Drag-and-drop calendar view of all scheduled broadcasts.
*   [ ] **Holiday Presets**: One-click setup for Black Friday, Cyber Monday, Xmas, New Year.
*   [ ] **Smart Suggestions**: "Valentine's Day is in 2 weeks - Create a promo?".
*   [ ] **Timeline View**: Gantt-style chart to visualize overlapping campaigns (Email + Banner).
*   [ ] **Draft Board**: Kanban board (Idea -> Draft -> Scheduled -> Live) for planning.
*   [ ] **Annual Repeat**: "Schedule this every year on Dec 25th".
*   [ ] **Archive Comparison**: "How did 2024 Xmas compare to 2023?".
*   [ ] **Conflict Detection**: "Warning: You already have a Summer Sale banner on these dates".
*   [ ] **Asset Library**: Store seasonal images/icons (e.g., Santa Hat, Fireworks) for re-use.
*   [ ] **Weather Trigger**: (Advanced) Show "It's raining outside, stay in and boost traffic!" based on user IP.
*   [ ] **Local Holiday Sync**: Auto-suggest holidays based on target country (e.g., Diwali for India).
*   [ ] **Countdown Widget**: Auto-generate a "Sale Ends in 3 Days" timer to embed.
*   [ ] **Profit Predictor**: Estimate revenue impact based on previous year's performance.
*   [ ] **Dynamic Theme**: Auto-apply "Snow Effect" to the dashboard during Xmas promo.
*   [ ] **Competitor Watch**: Manual field to log "Competitor X is doing 50% off".
*   [ ] **Discount Ladder**: Auto-increase discount as deadline approaches (10% -> 20% -> 30%).
*   [ ] **Post-Event Report**: Auto-generated PDF summary of how the campaign performed.
