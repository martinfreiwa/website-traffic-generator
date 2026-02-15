# Global Analytics & Insights Implementation Plan

**Component**: `Analytics.tsx`
**Route**: `/dashboard/analytics`

## Purpose
Provides a macro-level view of account performance across all campaigns, enabling users to identify trends and optimize their traffic strategy.

## Features
*   [ ] **Global Traffic Overview**: Multi-line chart showing total hits, unique visitors, and average session duration.
*   [ ] **Geographical Heatmap**: Interactive map showing traffic distribution by country and city.
*   [ ] **Device & OS Breakdown**: Pie charts for Mobile vs Desktop vs Tablet and OS distribution.
*   [ ] **Referral Source Analysis**: Table showing which landing pages or referrers are performing best.
*   [ ] **ROI Calculator**: Estimate the value of generated traffic based on industry CPC benchmarks.

## Planned Improvements
*   [ ] **Comparison Tool**: Compare performance between two time periods (e.g., This Month vs Last Month).
*   [ ] **Custom Date Range**: Calendar picker for specific reporting periods.
*   [ ] **Export Reports**: Generate PDF/CSV reports for stakeholders.
*   [ ] **Conversion Tracking**: Integration with user-side pixels to track actual goal completions.
*   [ ] **Traffic Quality Score**: AI-based rating of traffic "realism" and SEO value.
*   [ ] **Anomaly Detection**: Alerts for sudden spikes or drops in traffic volume.
*   [ ] **Competitor Benchmarking**: Compare your traffic volume against industry averages.
*   [ ] **Live Feed**: Scrolling ticker of real-time hits across all active projects.
*   [ ] **Predictive Analytics**: Forecast future traffic based on current credit burn and trends.
*   [ ] **Annotation System**: Add notes to the graph (e.g., "Started social media campaign").
*   [ ] **Widget Customization**: Drag-and-drop dashboard widgets for personalized metrics.
*   [ ] **Public Dashboard**: Generate a password-protected link to share stats with clients.
*   [ ] **Channel Grouping**: Categorize traffic into "Organic", "Social", "Direct", etc.
*   [ ] **Performance Tips**: Dynamic suggestions based on low-performing segments.
*   [ ] **Slack/Discord Integration**: Push daily summary reports to team channels.

## Dependencies
*   `recharts` for visualization.
*   `react-simple-maps` for the geo-heatmap.
*   `AnalyticsService` for data aggregation.
