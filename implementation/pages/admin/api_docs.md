# API Documentation Implementation Plan

**Component**: `ApiDocs.tsx`
**Route**: `/admin/api-docs`

## Purpose
Internal (or public-facing) documentation for the platform's API.

## Features
*   [ ] **Endpoint List**: All available API methods.
*   [ ] **Try It Out**: Interactive console (Swagger/OAS style).
*   [ ] **Code Snippets**: Examples in Python/JS/Curl.

## Planned Improvements
*   [ ] **Auto-Generation**: Script to sync docs with backend schema.
*   [ ] **Admin Sandbox**: Safe environment to test destructive API calls.
*   [ ] **Response Examples**: JSON snippets of success/error responses.
*   [ ] **Rate Limit Info**: clearly display current rate limits per endpoint.
*   [ ] **Changelog**: Section for API version history.
*   [ ] **Code Generator**: "Copy Python/Node.js/Go code" button for every request.
*   [ ] **Webhook Tester**: Utility to send a test payload to a user's URL.
*   [ ] **Error Dictionary**: List of all possible error codes and meanings.
*   [ ] **Postman Export**: "Download Collection" button.
*   [ ] **Authentication Guide**: Dedicated page for how to sign requests.
*   [ ] **Status Page Link**: Link to external status page monitor.
*   [ ] **Search Bar**: Quick find for endpoints.
*   [ ] **Deprecation Warning**: Badges for "Deprecated" endpoints.
*   [ ] **SDK Links**: Links to official client libraries (if any).
*   [ ] **Feedback Button**: "Report issue with these docs".
*   [ ] **Dark Mode**: Separate toggle for docs readability.
*   [ ] **Header Auth**: Input field to set global Bearer token for "Try It".
*   [ ] **Response Schema**: Interactive clickable JSON schema tables.
*   [ ] **Required Fields**: Highlight mandatory params in red.
*   [ ] **Mock Server**: Toggle to hit mock endpoint instead of real one.
*   [ ] **Print view**: PDF friendly styles.
*   [ ] **Last Updated**: "Docs generated on [Date]".
*   [ ] **Versioning**: Dropdown to switch between v1 and v2 API.
*   [ ] **Websockets**: Docs for socket.io events and payloads.
*   [ ] **Graphql Schema**: If GraphQL is used, show schema explorer.
*   [ ] **Permissions**: Show "Requires Admin Scope" badge per endpoint.
*   [ ] **Request History**: LocalStorage log of recent console requests.
*   [ ] **Copy Curl**: One-click copy curl command.
*   [ ] **Download Spec**: Download openapi.json file.
*   [ ] **Link to Support**: "Need help with integration?" CTA.
*   [ ] **API SLA**: "99.9% uptime guarantee" banner.
*   [ ] **Rate Limit Headers**: "X-RateLimit-Remaining" documentation.
*   [ ] **Pagination**: Guide on how to use `limit` and `offset`.
*   [ ] **Filtering**: Guide on how to use `?filter=x`.
*   [ ] **Field Selection**: Guide on `?fields=id,name` partial response.
*   [ ] **Idempotency**: Explanation of `Idempotency-Key` header.
*   [ ] **Batch Operations**: Docs for `/batch` endpoint if exists.
*   [ ] **Nested Objects**: How to handle JSON body nesting.
*   [ ] **Date Formats**: "All dates are ISO 8601" note.
*   [ ] **Common Use Cases**: "How to create a project" walkthrough.
*   [ ] **Errors Breakdown**: "401 vs 403" explanation.
*   [ ] **Glossary**: Definitions of domain terms (e.g. "Hit", "Bounce").
*   [ ] **Contact DevRel**: Email link to Developer Relations team.
*   [ ] **Release Notes**: Link to blog post about API updates.
*   [ ] **Environment**: Toggle "Production / Staging / Local" base URL.
*   [ ] **Dynamic Vars**: Replace `:id` with `123` in paths auto-magically.
*   [ ] **Collapse All**: Button to close all endpoint accordions.

