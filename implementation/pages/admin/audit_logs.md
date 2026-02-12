# Admin Audit Logs Implementation Plan

**Components**: `AdminAudit.tsx`
**Routes**: `/admin/audit`

## Purpose
Historical record of every significant action taken on the platform for compliance and security.

## Features
*   [ ] **Log List**: Time-ordered list of events.
*   [ ] **Filters**: By User, IP, Action Type.
*   [ ] **Details**: viewing the "Before" and "After" state of changes.

## Planned Improvements
*   [ ] **Immutable Storage**: cryptographic proof logs haven't been tampered.
*   [ ] **Retention Policy**: Auto-delete logs after X years (compliance).
*   [ ] **Export Compliance**: Download "GDPR Access Request" package.
*   [ ] **Admin Actions**: Highlight actions taken by Staff.
*   [ ] **Sensitive Data**: Mask PII in log viewer automatically.
*   [ ] **Search Syntax**: "user:123 AND action:login".
*   [ ] **Alert Rules**: "Notify if Admin changes Password".
*   [ ] **IP Intelligence**: ISP/Location info for every IP logged.
*   [ ] **Device Fingerprint**: Track changes in user devices.
*   [ ] **Session ID**: Correlate all logs to a specific login session.
*   [ ] **Failed Attempts**: Dedicated view for failed auth/actions.
*   [ ] **API Access Logs**: Trace of every API key usage.
*   [ ] **Webhook Logs**: Trace of every outgoing webhook.
*   [ ] **Email Logs**: Trace of every email sent (delivered/bounce).
*   [ ] **Data Export Logs**: Who downloaded the "All Users" CSV?
*   [ ] **Visual Timeline**: Graph of activity volume per hour.
*   [ ] **Diff Viewer**: Visual red/green diff for text changes.
*   [ ] **User Journey**: "Replay" a sequence of user events.
*   [ ] **System Events**: "Server Restarted", "Deploy Completed".
*   [ ] **Error Correlation**: Link logs to error exceptions.
*   [ ] **Archive to S3**: Auto-move old logs to cold storage.
*   [ ] **Real-time Stream**: "Tail" the log file live.
*   [ ] **Severity Level**: Info, Warning, Critical tags.
*   [ ] **Component Source**: "Frontend", "Backend", "Worker".
*   [ ] **Request ID**: `X-Request-ID` tracing across services.
*   [ ] **User Impersonation Log**: "Admin X acted as User Y".
*   [ ] **Sensitive Access**: "Admin viewed partial full credit card".
*   [ ] **Configuration Changes**: "Global Setting X changed from A to B".
*   [ ] **Permission Changes**: "User promoted to Admin".
*   [ ] **Rate Limit Hits**: Logs of users hitting API walls.
*   [ ] **WAF Blocks**: Logs of firewall rejections.
*   [ ] **SQL Slow Log**: (Optional) DB performance correlation.
*   [ ] **Printable Report**: Format for auditor review.
*   [ ] **JSON raw view**: See the exact payload.
*   [ ] **Timezone Toggle**: View logs in User time vs UTC.
*   [ ] **Quick Ban**: Ban IP directly from log entry.
*   [ ] **Cross-Reference**: Link IP to all other users utilizing it.
*   [ ] **Velocity Checks**: "100 actions in 1 minute" flag.
*   [ ] **Anomaly Detection**: AI flag for "Unusual behavior".
*   [ ] **Legal Hold**: "Freeze" logs so they cannot be deleted.

