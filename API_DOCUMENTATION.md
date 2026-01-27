# Traffic Nexus: API Documentation (v1)

Welcome to the Traffic Nexus White-Label API. This document outlines the endpoints available for external integration and automation.

## Base URL
`http://localhost:8000`

---

## 1. Project Management

### GET `/projects`
Returns a list of all saved projects and their targets.

### POST `/projects`
Create a new project.
**Body:**
```json
{
  "name": "Summer Campaign",
  "visitors_per_min": 50,
  "mode": "professional",
  "tier": "professional",
  "utm_tags": { "source": "email", "medium": "newsletter" },
  "targets": [
    { "url": "https://example.com", "title": "Home" }
  ]
}
```

### DELETE `/projects/{id}`
Delete a specific project.

---

## 2. Proxy Pool

### GET `/proxies`
List all active proxies in the rotation pool.

### POST `/proxies`
Add a new proxy.
**Body:**
```json
{
  "url": "http://user:pass@host:port",
  "country": "US"
}
```

---

## 3. Traffic Simulation

### POST `/start`
Start a real-time traffic simulation burst.
**Body:**
```json
{
  "targets": [{ "url": "...", "title": "..." }],
  "visitors_per_min": 100,
  "duration_mins": 5,
  "is_dry_run": false
}
```

### POST `/stop`
Immediately halt all active simulations.

---

## 4. Statistics & Analytics

### GET `/stats`
Returns aggregated throughput data, success rates, and the live activity feed.

### GET `/events`
Returns the 50 most recent page-view events with proxy and timestamp meta-data.

---

## Tiers & Limits
- **Economy**: Limited to 500 visitors/day, fixed User-Agent, no geo-targeting.
- **Professional**: Unlimited visitors, deep fingerprinting, global geo-aware rotation.
