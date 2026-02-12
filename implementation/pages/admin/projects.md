# Admin Project Management Implementation Plan

**Components**: `AdminProjects.tsx`, `AdminCreateProject.tsx`, `AdminEditProject.tsx`
**Routes**: `/admin/projects`, `/admin/projects/new`, `/admin/projects/:id`

## Purpose
Super-admin control over all campaigns on the platform.

## Features
*   [x] **Project List**: Global list of all campaigns.
*   [ ] **Create Project**: Manually create campaign for any user.
*   [ ] **Edit Project**: Force stop/pause, adjust hidden parameters (priority, weight).
*   [ ] **Debug**: View raw logs for specific project execution.

## Planned Improvements
*   [ ] **Admin Boost**: Flag to prioritize project in the queue.
*   [ ] **Force Stop Reason**: Text input to explain why a project was stopped.
*   [ ] **Batch Edit**: Adjust settings for multiple projects at once.
*   [x] **Search by Domain**: Quickly find all campaigns targeting `domain.com`.
*   [ ] **Flagged Projects**: Auto-flag campaigns with suspicious URLs (phishing etc).
*   [ ] **Domain Blacklist**: "Prevent any user from targeting youtube.com".
*   [ ] **Priority Slider**: -10 to +10 weight adjustment for scheduling queue.
*   [ ] **Bot Type Filter**: "Show all projects using Mobile bots".
*   [ ] **Project Forensics**: Deep dive audit of project clicks (IP, UA, Timestamp).
*   [ ] **Re-Queue**: Force retry of failed hits.
*   [ ] **Cancel Jobs**: Clear pending Redis jobs for this project.
*   [ ] **Transfer Ownership**: Move project to another user account.
*   [ ] **Clone Project**: Duplicate project for debugging.
*   [ ] **Snapshot Config**: View JSON of project settings at time X.
*   [ ] **Traffic Source Override**: Force all traffic to appear as "Search".
*   [ ] **Bot Config Override**: Force specific proxy tier for this project.
*   [ ] **Max Cost Cap**: Set hard limit on credits consumed per day administratively.
*   [ ] **Hidden Project**: Toggle visibility to user (shadow mode).
*   [ ] **Note for User**: Add admin message visible on user dashboard.
*   [ ] **Internal Tags**: Categorize projects (e.g. "Test", "Refund Dispute").
*   [ ] **Screenshot**: Trigger manual screenshot of target URL.
*   [ ] **DNS Check**: Run server-side DNS lookup of target.
*   [ ] **Ping Check**: Verify target is reachable from server.
*   [ ] **SSL Verify**: Check SSL certificate validity.
*   [ ] **Malware Scan**: Check target against Google Safe Browsing API.
*   [ ] **Whois Lookup**: View domain registration info.
*   [ ] **Archive**: Force archive old project.
*   [ ] **Restore**: Un-archive project.
*   [ ] **Export Config**: Download project settings as JSON.
*   [ ] **Bulk Delete**: Remove spam projects en masse.
*   [ ] **Refund Hits**: Credit back user for undelivered/failed hits.
*   [ ] **Manual Hit**: Trigger single hit for testing.
*   [ ] **Worker Affinity**: Pin project to specific worker node.
*   [ ] **Rate Limit Override**: Allow this project to exceed global speed limits.
*   [ ] **Concurrency Override**: Allow more parallel threads for this project.
*   [ ] **Analytics Reset**: Wipe stats for this project.
*   [ ] **Conversion Tracking**: Manually enter conversion data.
*   [ ] **Webhook Trigger**: Fire project webhook manually.
*   [ ] **Cost Adjust**: Change CPC rate for this specific project.

