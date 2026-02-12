# Project Details Implementation Plan

**Component**: `ProjectDetails.tsx`
**Route**: `/dashboard/project/:id`

## Purpose
The control center for a specific traffic campaign. Allows detailed monitoring and configuration updates.

## Features
*   [ ] **Real-time Stats**: Live visitor count, total hits delivered.
*   [ ] **Configuration**: Edit URL, change volume, update geo-targeting.
*   [ ] **Analytics**: Historical data visualization (Hourly/Daily/Monthly).
*   [ ] **Logs**: recent hits log table.

## Planned Improvements
*   [ ] **Schedule Email Report**: Auto-send PDF reports to client emails.
*   [ ] **Night Mode Schedule**: Automatically pause traffic during specific hours.
*   [ ] **Click Heatmap**: Simulated visual representation of user activity.
*   [ ] **Live Log Stream**: WebSocket connection to see hits as they happen.
*   [ ] **Shareable Report Link**: Public (read-only) link to specific project stats.
*   [ ] **Notes Field**: Private text area for user notes on a campaign.
*   [ ] **Traffic Shape**: Visual curve editor (Constant, Spike, Sine Wave) for distribution.
*   [ ] **Device Ratio**: Sliders for Mobile vs Desktop vs Tablet percentage.
*   [ ] **Referrer List**: Custom list of URLs to use as Referers (e.g., facebook.com, google.com).
*   [ ] **World Map**: Interactive map showing hits per country.
*   [ ] **Comparison Mode**: Compare this project's performance vs another period.
*   [ ] **Screenshot Preview**: Show a thumbnail of how the site looks to the bot.
*   [ ] **Speed Test**: Check target URL load time from bot location.
*   [ ] **Clone to New**: Create a new project with identical settings from this page.
*   [ ] **Alerts**: "Email me if hits drop to 0".
*   [ ] **Browser Distribution**: Pie chart of Chrome vs Firefox vs Safari.
*   [ ] **OS Distribution**: Pie chart of Windows vs Mac vs Android.
*   [ ] **Bounce Rate Selection**: Slider to artificially adjust bounce behavior.
*   [ ] **Session Duration**: Histogram of time spent on site.
*   [ ] **Scroll Depth**: Configurable target scroll depth (0-100%).
*   [ ] **Click Target**: Specify CSS selector for bot to attempt to click.
*   [ ] **Mouse Trail**: Toggle to enable mouse movement simulation.
*   [ ] **Cookie Clear**: "New session on every hit" toggle.
*   [ ] **Header Inspection**: View HTTP headers sent/received by last bot.
*   [ ] **Error Log**: Dedicated tab for failed attempts (404, 500 errors).
*   [ ] **Organic Keyword**: Input "search term" to simulate organic search visit.
*   [ ] **Direct Visit**: Toggle for Direct vs Referral traffic.
*   [ ] **Social Signals**: Preset for "Facebook/Twitter/Reddit" referral mix.
*   [ ] **UTM Builder**: Helper to append UTM params to target URL.
*   [ ] **Time on Page**: Bell curve configuration for visit duration.
*   [ ] **Page Depth**: "Visit 2-3 pages per session" setting.
*   [ ] **Sub-page Weight**: "Spend 70% time on homepage, 30% on blog".
*   [ ] **Custom User-Agent**: Input specific UA string to use.
*   [ ] **Language Header**: "Accept-Language: es-ES" setting.
*   [ ] **Resolution**: Set viewport size (e.g., 1920x1080).
*   [ ] **DNS Lookup**: Debug tool to see what IP the bot resolves.
*   [ ] **Trace Route**: View network path from bot to target.
*   [ ] **SSL Verify**: "Ignore SSL Errors" toggle (for staging sites).
*   [ ] **Basic Auth**: Inputs for username/password for protected sites.
*   [ ] **Custom Headers**: Key-value pair input for extra request headers.
*   [ ] **Post Data**: Ability to send POST requests with body (advanced).
*   [ ] **Max Redirects**: Set limit to prevent infinite loops.
*   [ ] **Timeout**: Set custom connection timeout in seconds.
*   [ ] **Proxy Zone**: Select "Residential vs Datacenter" IP pool.
*   [ ] **Success Criteria**: Define what counts as a "hit" (e.g., HTTP 200).
*   [ ] **Download Time**: Graph of average page load speed.
*   [ ] **JS Exception**: Log if target site throws JS errors (useful for clients).
*   [ ] **Bot Location**: "Hit came from Worker Node 4 in London".
*   [ ] **Cost Analysis**: "This project has consumed $12.50".
*   [ ] **Daily Cap**: "Stop after 500 hits today".

