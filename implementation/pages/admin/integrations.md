# Admin Integrations Implementation Plan

**Components**: `AdminIntegrations.tsx`
**Routes**: `/admin/integrations`

## Purpose
Manage connections to external services and third-party tools.

## Features
*   [ ] **Provider Config**: Switch between Email/SMS providers.
*   [ ] **Marketplace**: List of available user integrations.
*   [ ] **Status Check**: Verify API connections.

## Planned Improvements
*   [ ] **Slack Bot**: Config "Send new signup alerts to #sales".
*   [ ] **Discord Bot**: Manage community server roles/invites.
*   [ ] **Stripe Connect**: Manage connected delivery accounts (if marketplace).
*   [ ] **Zapier App**: Visual guide to getting API key for Zapier.
*   [ ] **SSO Config**: SAML/OIDC metadata upload for Enterprise users.
*   [ ] **Cloudflare**: API controls for purging cache/WAF rules.
*   [ ] **Google Analytics**: Input GA4 Measurement ID backend-side.
*   [ ] **Intercom/Crisp**: Toggle support chat widget provider.
*   [ ] **Sentry/LogRocket**: Toggle frontend monitoring tools.
*   [ ] **AWS/S3**: Credential manager for file storage.
*   [ ] **OpenAI/LLM**: API key management for AI features.
*   [ ] **Twilio/Telesign**: SMS provider failover priority.
*   [ ] **IP2Location**: Manage GeoIP database license key.
*   [ ] **Coinbase/Bitpay**: Crypto gateway configuration.
*   [ ] **Webhooks Out**: Global event stream to external URL.
*   [ ] **Salesforce/Hubspot**: CRM 2-way sync status.
*   [ ] **Mailchimp/Klaviyo**: Newsletter list sync.
*   [ ] **Jira/Linear**: "Create Issue" integration for support tickets.
*   [ ] **GitHub/GitLab**: Link commits to deployment events.
*   [ ] **Upstream Proxies**: Manage credentials for residential proxy networks.
*   [ ] **Captcha**: Switch between Recaptcha, hCaptcha, Turnstile.
*   [ ] **Translation**: API key for DeepL/Google Translate.
*   [ ] **Currency**: Fixer.io/OpenExchangeRates API key.
*   [ ] **Screenshot**: API key for url-to-image service.
*   [ ] **PDF Generation**: API key for PDF generation service.
*   [ ] **Search**: Algolia/Meilisearch host configuration.
*   [ ] **Redis**: Connection string manager (read-only/test).
*   [ ] **Postgres**: Connection pool settings.
*   [ ] **SMTP Relay**: SendGrid/Postmark toggle.
*   [ ] **Feature Vote**: Canny/Upvoty integration script.
*   [ ] **Legal Sign**: HelloSign/DocuSign integration for contracts.
*   [ ] **KYC Provider**: SumSub/Veriff integration status.
*   [ ] **Browserless**: Puppeteer cluster connection settings.
*   [ ] **VPN/Tunnel**: Wireguard config for private networking.
*   [ ] **Monitoring**: Datadog/NewRelic agent status.
*   [ ] **Backup**: Google Drive/Dropbox export targets.
*   [ ] **Status Page**: Atlassian Statuspage.io API link.
*   [ ] **Calendar**: Cronofy/Google Calendar link for meetings.
*   [ ] **Video**: Mux/Vimeo API settings.
*   [ ] **Maps**: Mapbox/Google Maps API key.

