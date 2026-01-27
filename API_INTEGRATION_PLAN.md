# Master API Integration Plan: TrafficGen Pro (SaaS Edition)

> [!IMPORTANT]
> **Expert Review Status**: This plan has been refined to strictly match the `Test-Site` business logic, including documented Affiliate tiers, CPM pricing curves, and specific data structures found in the source code.

This document outlines the architecture to transform the static `Test-Site` into a high-performance SaaS, backed by our Python Traffic Engine.

---

## 1. Core Architecture Strategy

### The "Hybrid Storage" Pattern
The Frontend (`ProjectDetails.tsx`) allows for highly complex, nested configuration (e.g., specific device probabilities + multi-geo targeting). Mapping this 1:1 to SQL columns is rigid and prone to breakage.
*   **Solution**: We will store the full Frontend Settings Object as a `JSONB` column (`settings_dump`) in the database.
*   **Benefit**: The Frontend always gets back *exactly* what it saved.
*   **Execution**: The Traffic Engine will parse this JSON blob at runtime to determine behavior.

---

## 2. Database Schema (PostgreSQL)

### A. Users & Auth
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'user', -- 'user', 'admin'
    balance DECIMAL(10, 2) DEFAULT 0.00,
    api_key VARCHAR UNIQUE,
    affiliate_code VARCHAR UNIQUE, -- Generated from ID
    referred_by UUID REFERENCES users(id), -- For Affiliate System
    created_at TIMESTAMP DEFAULT NOW(),
    -- Extended Profile
    phone VARCHAR, company VARCHAR, vat_id VARCHAR,
    address VARCHAR, city VARCHAR, country VARCHAR
);
```

### B. Affiliate System (New Discovery)
Based on `Affiliate.tsx`: "20% Lifetime Commission".
```sql
CREATE TABLE affiliate_earnings (
    id UUID PRIMARY KEY,
    referrer_id UUID REFERENCES users(id),
    referee_id UUID REFERENCES users(id), -- The user who bought credits
    transaction_id UUID REFERENCES transactions(id),
    amount DECIMAL(10, 2), -- The 20% cut
    status VARCHAR DEFAULT 'pending', -- 'pending' -> 'paid'
    created_at TIMESTAMP DEFAULT NOW()
);
```

### C. Projects
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'active', -- 'active', 'stopped', 'completed'
    plan_type VARCHAR DEFAULT 'Custom',
    
    -- High Level Constraints (for SQL Querying)
    daily_limit INT DEFAULT 0,
    total_target INT DEFAULT 0,
    expires_at TIMESTAMP,
    
    -- THE CORE CONFIG
    settings JSONB NOT NULL, -- Stores the full ProjectSettings object
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

### D. Financials
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type VARCHAR, -- 'credit' (deposit), 'debit' (campaign_spend), 'bonus'
    amount DECIMAL(10, 2),
    description VARCHAR,
    status VARCHAR DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. High-Precision Business Logic

### A. Dynamic Pricing Engine (`/api/billing/quote`)
Based on `BuyCredits.tsx`, the API must implement this exact curve for the "Custom Amount" calculator:

| Investment Tier | CPM Rate (€/1k Visits) |
| :--- | :--- |
| < €129 | **~€0.58** |
| €129 - €398 | **~€0.43** |
| €399 - €998 | **~€0.40** |
| €999 - €1248 | **~€0.33** |
| €1249 - €2998 | **~€0.25** |
| >= €2999 | **~€0.20** |

**Logic**: 
1. `GET /api/billing/quote?amount=500`
2. Backend calculates: `500 / 0.40 = 1,250,000` visits.
3. Returns: `{ "estimated_visits": 1250000, "rate": 0.40 }`

### B. Payment Webhooks
Since payment links (Wise/Revolut) are external:
1.  **Endpoint**: `POST /api/webhooks/payment_provider`
2.  **Logic**:
    *   Verify signature.
    *   Find User by Email/Metadata.
    *   `INSERT INTO transactions (type='credit', amount=...)`.
    *   `UPDATE users SET balance = balance + amount`.
    *   **TRIGGER**: Check `users.referred_by`. If exists:
        *   Calc `commission = amount * 0.20`.
        *   `INSERT INTO affiliate_earnings ...`.
        *   (Optional: Auto-credit referrer balance immediately or wait for payout).

---

## 4. Traffic Engine Integration (The "Brain")

### A. Job Dispatcher
The `visitor_engine.py` needs to be upgraded to parse the `settings` JSONB.

**Mapping Logic (JSON -> Engine Params):**
*   `settings.trafficSpeed` (0-100) -> Maps to `emulator.concurrency` (linear scale).
*   `settings.deviceSplit` (70) -> `if random() < 0.7: use_desktop_agent() else: use_mobile_agent()`.
*   `settings.geoTargets` -> Logic:
    ```python
    # Weighted Random Selection
    targets = [{"cc": "US", "w": 50}, {"cc": "DE", "w": 50}]
    selected_cc = weighted_choice(targets)
    proxy = get_proxy_for_country(selected_cc)
    ```
*   `settings.timeOnPage` -> Parse string "3 minutes" -> `wait(180s)`.

### B. Live Pulse (SSE)
For `AdminLiveUsers.tsx` to work:
*   **Endpoint**: `GET /api/admin/live-stream` (Server-Sent Events).
*   **Trigger**: Whenever `visitor_engine` successfully visits a URL:
    *   Push Event: `{"type": "hit", "project_id": "...", "url": "...", "country": "US", "ip": "..."}`.
*   **Frontend**: Connects `EventSource` and updates the Real-time table.

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Days 1-2)
- [ ] Initialize PostgreSQL DB with schemas above.
- [ ] Create `main.py` endpoints for Auth (JWT) and User Profile.
- [ ] Implement `POST /projects` with JSONB storage.

### Phase 2: Core Logic (Days 3-4)
- [ ] Implement the **Pricing Engine** (Quote API).
- [ ] Implement **Affiliate Logic** (Link tracking + DB triggers).
- [ ] Build `GET /projects` to return JSONB settings 1:1.

### Phase 3: The Engine Bridge (Days 5-7)
- [ ] Upgrade `visitor_engine.py` to read from PostgreSQL `projects` and parse `settings`.
- [ ] Implement Multi-Geo Proxy Selector based on `geoTargets`.
- [ ] Create SSE Endpoint for Live Pulse.

### Phase 4: Migration & Polish
- [ ] Write script to seed `Test-Site` local data into Prod DB.
- [ ] Test Payment Webhook flow.

---
*Status: READY FOR EXECUTION*
Use this plan as the single source of truth. It covers hidden complexity in billing, affiliates, and configuration persistence.
