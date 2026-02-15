# API & Developer Portal Implementation Plan

**Component**: `ApiPortal.tsx`
**Route**: `/dashboard/api`

## Purpose
Empowers advanced users to automate traffic generation by providing access to the REST API, monitoring usage, and managing webhooks.

## Features
*   [ ] **API Key Management**: CRUD interface for generating and revoking API keys.
*   [ ] **Usage Monitoring**: Real-time display of API requests vs rate limits.
*   [ ] **Webhook Configuration**: Interface to set up URLs for automated event notifications (e.g., "Campaign Finished").
*   [ ] **Request Logs**: List of the last 100 API calls with status codes and response times.
*   [ ] **Interactive Documentation**: Embedded Swagger UI or simplified REST reference.

## Planned Improvements
*   [ ] **IP Whitelisting**: Restrict API key usage to specific server IPs.
*   [ ] **Scoping/Permissions**: Create keys with read-only or project-specific access.
*   [ ] **Usage Quotas**: Set hard or soft credit limits for API operations.
*   [ ] **Code Snippets**: "Copy as Curl/Python/JS" buttons for common endpoints.
*   [ ] **Health Status**: Indicator showing overall API system uptime.
*   [ ] **Payload Explorer**: Tool to test API body structures before sending.
*   [ ] **Library Download**: Links to official SDKs (e.g., Python package, Node.js wrapper).
*   [ ] **Version Management**: Toggle between API versions (v1 vs v2).
*   [ ] **Email Alerts**: Notify developers if API keys are nearing rate limits.
*   [ ] **Developer Community**: Link to Discord/StackOverflow for technical support.
*   [ ] **Audit Trail**: track who (which sub-user) generated which key.
*   [ ] **Postman Collection**: One-click download of workspace collection.
*   [ ] **Rate Limit Increase**: "Request Higher Limit" workflow for enterprise.

## Dependencies
*   `ApiMiddleware` for authentication tracking.
*   `SwaggerUI` (optional) for docs.
*   `WebhookService` for delivery.
