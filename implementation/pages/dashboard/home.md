# Home Dashboard Implementation Plan

**Component**: `HomeDashboard.tsx`
**Route**: `/dashboard` (default view)

## Purpose
Provides a high-level overview of the user's account performance, active projects, and recent notifications.

## Features
*   [ ] Traffic Summary Chart (Total hits, active now).
*   [ ] Recent Projects List (Quick access).
*   [ ] System Status / Notifications.
*   [ ] "Quick Start" campaign button.

## Planned Improvements
*   [ ] **Daily SEO Tip**: Random tip card for improving website ranking.
*   [ ] **Customizable Widgets**: Allow users to reorder or hide dashboard cards.
*   [ ] **Dark Mode Sync**: Ensure dashboard theme matches system preference automatically.
*   [ ] **Onboarding Tour**: Guided tooltip tour for new users.
*   [ ] **Gamification Level**: "Level 1 User" progress bar based on traffic used.
*   [ ] **Announcement Modal**: Pop-up for critical system news on login.
*   [ ] **Traffic Forecast**: "Weather widget" style visualization of expected traffic today.
*   [ ] **Streak Counter**: "You've had active traffic for X days straight!"
*   [ ] **Regional Map**: Mini heatmap showing where your traffic is currently coming from.
*   [ ] **Shortcut Keys**: "Press 'N' to create new project" hint.
*   [ ] **Affiliate Widget**: "You have earned $X this month" mini card.
*   [ ] **System Load**: "Network is running at 98% capacity" indicator.
*   [ ] **Quick Buy**: "Buy 500 Credits" button directly on the dashboard.
*   [ ] **Account Age**: "User for 342 days" badge.
*   [ ] **Personal Goal**: Progress bar for "Reach 1 Million hits this month".
*   [ ] **Time of Day Greeting**: "Good Morning/Reviewing" based on user time.
*   [ ] **Next Invoice**: "Next invoice due in 12 days" reminder.
*   [ ] **Support Status**: "Support is currently online" green dot.
*   [ ] **Quick Filter**: Buttons to filter 'Recent Projects' by status.
*   [ ] **Referral Progress**: "You are 2 referrals away from Pro Status" bar.
*   [ ] **Last Login**: "Last login: Yesterday from IP 1.2.3.4".
*   [ ] **Credit Burn Rate**: "At current speed, credits last 4 days".
*   [ ] **Feedback Box**: Mini "How are we doing?" smiley face rater.
*   [ ] **Feature Vote**: "Vote for next feature" poll widget.
*   [ ] **Community Link**: Button to join Discord/Telegram group.
*   [ ] **Traffic Quality Score**: "Your traffic config is rated 'A' for realism".
*   [ ] **Platform Distribution**: Pie chart of Mobile vs Desktop traffic sent today.
*   [ ] **Focus Mode**: Button to hide all distractions/sidebar.
*   [ ] **Quick Clone**: "Rerun yesterday's campaign" one-click action.
*   [ ] **Usage Heatmap**: Calendar view showing days with most activity.
*   [ ] **Did You Know**: Interesting fact about internet traffic.
*   [ ] **Upgrade Nudge**: Subtle "Unlock 2x speed with Pro" card.
*   [ ] **Maintenance Countdown**: "System update in 2 hours" (if scheduled).
*   [ ] **Search Bar**: Global search (Projects, Settings, Help) in header.
*   [ ] **Latency Indicator**: "Ping to server: 45ms".
*   [ ] **Live Ticker**: Scrolling text of recent platform wins (e.g. "User X hit 1M visits").
*   [ ] **Data Saver**: Toggle to disable live charts for slow connections.
*   [ ] **Print Dashboard**: CSS optimized print-view for executive summary.
*   [ ] **Widget Resize**: Drag handles to resize cards (1x1, 2x2).
*   [ ] **Panic Button**: "Pause ALL Campaigns" emergency toggle.
*   [ ] **Currency Convert**: Toggle to view estimated ROI value of traffic.
*   [ ] **Theme Picker**: "Ocean / Sunset / Forest" color presets.
*   [ ] **Session Timer**: "Session expires in 30m" progress ring.
*   [ ] **Quick Translate**: Google Translate widget for dashboard UI.
*   [ ] **API Status**: "API is healthy" indicator.
*   [ ] **Recent Alerts**: List of last 3 notifications (e.g. "Project X finished").
*   [ ] **Referral Link Copy**: One-click copy button for affiliate link.
*   [ ] **Tutorial Video**: "Watch how to get started" embedded YouTube modal.
*   [ ] **Server Time**: Display exact server time (UTC) for scheduling reference.
*   [ ] **Project Health**: "3/5 projects are running optimally".
*   [ ] **Bonus Credits**: "Claim daily login bonus (10 credits)" button.

## Dependencies
*   `recharts` for charts.
*   `ProjectService` for data.
