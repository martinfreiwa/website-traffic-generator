# TrafficGen Pro SaaS - Agent Guidelines

This document serves as a comprehensive guide for agentic coding assistants operating in the TrafficGen Pro SaaS repository.

## Project Overview
TrafficGen Pro is a SaaS platform for automated traffic generation and Google Analytics simulation. It features a FastAPI backend and a React/TypeScript/Vite frontend. The system manages user balances, traffic projects (campaigns), and real-time analytics.

---

## 1. Build, Lint, and Test Commands

### Backend (Python/FastAPI)
The backend is located in the `backend/` directory.

- **Setup:** `pip install -r backend/requirements.txt`
- **Development Server:** `uvicorn main:app --reload --port 8000` (run from `backend/`)
- **Run All Tests:** `pytest backend/tests/`
- **Run Specific Test File:** `pytest backend/tests/test_saas_flow.py`
- **Run Single Test Case:** `pytest backend/tests/test_saas_flow.py::test_health_check`
- **Run with Verbose Output:** `pytest backend/tests/test_saas_flow.py -v`
- **Run Single Test with Full Details:** `pytest backend/tests/test_api_internal.py::TestAPIs::test_health -vv`
- **Database Migrations:** Tables are auto-created via `models.Base.metadata.create_all(bind=engine)` in `main.py`.
- **Database Path:** Defaults to `backend/traffic_nexus.db` (SQLite) unless `DATABASE_URL` is set.
- **Create Tables Only:** `python3 -c "import models; from database import engine; models.Base.metadata.create_all(bind=engine)"`

### Frontend (React/TypeScript/Vite)
The frontend is located in the `frontend/` directory.

- **Setup:** `npm install` (run from `frontend/`)
- **Development Server:** `npm run dev` (starts on port 3000 per `vite.config.ts`)
- **Build:** `npm run build`
- **Type Checking:** `npx tsc --noEmit`
- **Run Tests:** `npx vitest run`
- **Run Single Test File:** `npx vitest run frontend/projects.test.ts`
- **Run Tests with Watch:** `npx vitest`

### Docker
- **Up:** `docker-compose up --build`
- **Down:** `docker-compose down`

---

## 2. Code Style Guidelines

### General Principles
- **Consistency:** Rigorously adhere to existing naming and structural patterns.
- **Explicitness:** Prefer explicit types (`string`, `number`, `User`) over `any`.
- **Modularity:** Keep components and functions focused on a single responsibility.
- **Comments:** Avoid comments unless explaining complex logic; prefer self-documenting code.
- **Async/Await:** Use async/await consistently. Frontend db functions should return Promises when calling APIs.

### Backend (Python)
- **Framework:** FastAPI with Pydantic v2 for request/response validation.
- **ORM:** SQLAlchemy (Declarative Base).
- **Imports Order:**
    1. Standard library (`os`, `json`, `datetime`, `uuid`)
    2. Third-party packages (`fastapi`, `sqlalchemy`, `pydantic`, `httpx`)
    3. Local modules (`import models`, `from database import get_db`)
- **Naming:**
    - Functions/Variables: `snake_case` (e.g., `get_current_user`, `user_balance`)
    - Classes/Models/Schemas: `PascalCase` (e.g., `UserCreate`, `ProjectResponse`)
    - SQL Tables/Columns: `snake_case` (e.g., `balance_economy`, `api_key`)
    - Constants: `UPPER_SNAKE_CASE` (e.g., `SECRET_KEY`, `ALGORITHM`)
- **Error Handling:** Use `fastapi.HTTPException` with clear detail messages.
    - `400`: Validation/Logic errors (e.g., `"Email already registered"`)
    - `401`: Authentication failures (e.g., `"Invalid credentials"`)
    - `403`: Permission/Role issues (e.g., `"Admin access required"`)
    - `404`: Resource not found (e.g., `"Project not found"`)
- **Database Sessions:** Always use `get_db` dependency with context management:
    ```python
    def some_endpoint(db: Session = Depends(get_db)):
        # use db here
    ```
- **UUIDs:** Primary keys are string UUIDs via `str(uuid.uuid4())`.
- **Admin Endpoints:** Always check `current_user.role != "admin"` and raise 403 if not authorized.
- **Response Models:** Use Pydantic models with `response_model=ModelName` for type-safe responses.

### Frontend (React/TypeScript)
- **Framework:** React 19 with Vite and React Router DOM v7.
- **Components:** Functional components with arrow functions.
    ```tsx
    const MyComponent: React.FC<Props> = ({ prop }) => { ... }
    ```
- **API Calls:** Always use `await` and make db functions async when calling backend APIs.
- **Naming:**
    - Component Files: `PascalCase.tsx` (e.g., `Dashboard.tsx`)
    - Service Files: `camelCase.ts` (e.g., `db.ts`, `firebase.ts`)
    - Local Variables/Functions: `camelCase` (e.g., `handleLogin`, `currentUser`)
    - Interface Types: `PascalCase` (e.g., `ProjectSettings`, `GeoTarget`)
- **Types:** Centralized in `frontend/types.ts`. Reuse interfaces like `User`, `Project`, `Transaction`.
- **Data Fetching:**
    - Centralized in `frontend/services/db.ts`.
    - Always use `fetchWithAuth` for protected resources.
    - Handle 401 responses by dispatching the `auth-expired` event.
- **State Management:**
    - Local state: `useState`, `useEffect`.
    - Persistence: `localStorage` for tokens (`tgp_token`) and user profiles (`modus_current_user`).
    - Caching: Use `modus_projects_cache` style keys for offline-first behavior.
- **Backend Field Mapping:** Backend uses `snake_case` (e.g., `balance_economy`), frontend uses `camelCase` (e.g., `balanceEconomy`). Map in `db.ts`:
    ```typescript
    balanceEconomy: userData.balance_economy,
    ```

---

## 3. Directory Structure

```
backend/
├── main.py              # Entry point, middleware, all API endpoints
├── models.py            # SQLAlchemy models (User, Project, Transaction, etc.)
├── database.py          # Session and engine configuration
├── scheduler.py         # Background task orchestration
├── enhanced_hit_emulator.py  # Traffic simulation logic
├── web_utils.py         # GA4 TID extraction utilities
├── sitemap_crawler.py   # Sitemap parsing
├── email_service.py     # Email sending (Resend)
└── tests/               # Pytest suite
    ├── test_saas_flow.py
    ├── test_api_internal.py
    ├── test_chat.py
    └── test_profile_db_persistence.py

frontend/
├── App.tsx              # Root component with routing
├── index.tsx            # Entry point
├── types.ts             # TypeScript definitions
├── vite.config.ts       # Vite configuration (port 3000)
├── components/
│   ├── admin/           # Admin panel components
│   ├── landing/         # Public landing pages
│   ├── blog/            # Blog components
│   └── helpdesk/        # Support/ticket system
├── services/
│   ├── db.ts            # API wrapper with auth handling
│   └── firebase.ts      # Firebase integration
└── projects.test.ts     # Vitest test suite
```

---

## 4. Key Patterns & "Gotchas"

- **Hybrid Auth:** Endpoints support both JWT (Bearer) and `X-API-KEY` header. See `get_current_user` in `main.py`.
- **JSON Settings:** The `Project.settings` field is JSON/JSONB. Must map to `ProjectSettings` interface in `types.ts`.
- **SSE Analytics:** Real-time pulse data uses Server-Sent Events via `/admin/live-pulse`.
- **UUIDs:** Most primary keys are strings containing UUIDs, generated via `uuid.uuid4`.
- **Password Hashing:** Uses `argon2` via `passlib.CryptContext`.
- **Field Mapping:** Backend `snake_case` fields must be mapped to frontend `camelCase` in `db.ts`.
- **Protected Routes:** Use `ProtectedRoute` component with `adminOnly` prop for role-based access.
- **Balance Tiers:** Users have multiple balances: `balance`, `balance_economy`, `balance_professional`, `balance_expert`.
- **Rate Limiting:** Uses `slowapi` with `Limiter` middleware. Handler at `@app.exception_handler(RateLimitExceeded)`.
- **Static Files:** Served from `static/avatars` and `static/assets` directories.
- **Stripe Integration:** Uses `stripe` Python SDK with `STRIPE_SECRET_KEY` environment variable.
- **Email Service:** Uses Resend (`resend` package) via `email_service.py`. Configure with `RESEND_API_KEY`.
- **Database:** SQLAlchemy with SQLite (default) or PostgreSQL (via `DATABASE_URL` env var).

### Database Models
Recent additions to `models.py`:
- `UserSession` - Track active user sessions for real-time monitoring
- `ConversionSettings` - Social proof, exit intent, promo bar settings
- `LoyaltySettings` - Loyalty program configuration
- `ReferralSettings` - Referral program configuration
- `FAQ` - Help desk FAQs
- `Coupon` - Discount codes
- `MarketingCampaign` - Ad tracking campaigns

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `JWT_SECRET_KEY` | Required for JWT signing |
| `DATABASE_URL` | Postgres URL; defaults to SQLite if unset |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |
| `STRIPE_SECRET_KEY` | Stripe API key for payments |
| `RESEND_API_KEY` | Email sending via Resend |
| `SECRET_KEY` | FastAPI secret key (hardcoded in main.py as fallback) |

---

## 5. Guidelines for AI Agents

- **Incremental Changes:** When adding a field to a model, update the SQLAlchemy model, Pydantic schema, AND the frontend TypeScript interface.
- **Database Safety:** Always use `get_db` with `Depends()` in FastAPI endpoints.
- **Frontend Sync:** `db.ts` caches data in `localStorage`. If modifying backend responses, ensure `syncProjects` or similar functions handle new fields.
- **Test Verification:** After changes, run `pytest backend/tests/` and `npx tsc --noEmit` to verify.
- **Pydantic Models:** Use `BaseModel` for request/response schemas. Use `model_validator` for cross-field validation.
- **API Response Patterns:** Always return JSON-serializable data. Use Pydantic models for type safety.
- **New Features:** When adding new settings tables, use the pattern: GET creates default if not exists, PUT updates only provided fields.
- **Frontend Async:** Always convert localStorage-only functions to async API calls when backend endpoints are available.

---

*Revision: 2026-02-18 | Target: Agentic Coding Assistants*
