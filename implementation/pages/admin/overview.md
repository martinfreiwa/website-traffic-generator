# Admin Overview Implementation Plan

**Component**: `AdminOverview.tsx`
**Route**: `/admin` (Home)

## Purpose
Global health check for the platform. See key metrics at a glance.

## Features
*   [x] **Platform Stats**: Total Users, Total Active Projects, Daily Revenue.
*   [ ] **Resource Usage**: Server CPU/Ram load (if tracked), DB size.
*   [x] **Recent Activity**: Latest signups, latest payments.

## Planned Improvements
*   [ ] **Server Health Widget**: Real-time status of backend nodes/workers.
*   [ ] **Revenue Map**: Visualization of sales/users by country.
*   [ ] **Alert Banner**: Configurable system-wide alert display.
*   [ ] **Quick Actions**: One-click buttons for common tasks (e.g., "Clear Cache").
*   [ ] **Maintenance Scheduler**: Schedule future downtime windows.
*   [ ] **Top 10 Spenders**: List of highest LTV customers.
*   [ ] **Conversion Funnel**: "Visits -> Signups -> Payments" Sankey diagram.
*   [ ] **Bot Cost**: Estimated server cost per 1M hits delivered.
*   [ ] **API Error Rate**: Sparkline of 5xx errors from the API.
*   [ ] **New vs Returning**: Graph of new signups vs returning logins.
*   [ ] **Support Load**: "5 open tickets" indicator (Green/Red status).
*   [ ] **Churn Rate**: Metric showing percentage of users cancelling.
*   [ ] **MRR Display**: Monthly Recurring Revenue big number.
*   [ ] **ARR Display**: Annualized Revenue Run rate.
*   [ ] **ARPU**: Average Revenue Per User metric.
*   [ ] **LTV**: Customer Lifetime Value calculation.
*   [ ] **CAC**: Customer Acquisition Cost (if ad spend data available).
*   [ ] **Refund Rate**: Percentage of payments refunded.
*   [ ] **Chargeback Rate**: Critical metric for payment provider health.
*   [ ] **Active Discounts**: Total value of active coupons.
*   [ ] **Trial Conversion**: % of free users upgrading to paid.
*   [ ] **Bot Uptime**: Percentage of time bots are successfully running.
*   [less frequently used features below]
*   [ ] **API Latency**: Avg response time for user API calls.
*   [ ] **Database Load**: Query per second (QPS) graph.
*   [ ] **Redis Memory**: Cache usage percentage.
*   [ ] **Disk Usage**: Server storage space monitoring.
*   [x] **Admin Activity**: "Admin X logged in 5m ago".
*   [ ] **Failed Jobs**: Number of background tasks in "Failed" state.
*   [ ] **Queue Size**: Number of pending traffic jobs.
*   [ ] **Email Delivery**: SendGrid/SES delivery success rate.
*   [ ] **SMS Balance**: Remaining credits for SMS provider.
*   [ ] **Proxy Balance**: Remaining bandwidth/credits for proxy provider.
*   [ ] **User Growth**: Line chart of net new users.
*   [ ] **Traffic Growth**: Line chart of total hits delivered month-over-month.
*   [ ] **Device Breakdown**: Pie chart of traffic by device type globally.
*   [ ] **Browser Breakdown**: Global stats on browser usage.
*   [ ] **OS Breakdown**: Global stats on OS usage.
*   [ ] **Top Referrers**: Where are users coming from (if tracked).
*   [ ] **Verification Rate**: % of signups that verify email.
*   [ ] **2FA Adoption**: % of users with 2FA enabled.
*   [ ] **Ticket Volume**: Daily new support tickets graph.
*   [ ] **Response Time**: Avg support response time metric.
*   [ ] **NPS Score**: Net Promoter Score from user surveys.

