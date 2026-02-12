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
- **Run All Tests:** `pytest backend/`
- **Run Specific Test File:** `pytest backend/tests/test_saas_flow.py`
- **Run Single Test Case:** `pytest backend/tests/test_saas_flow.py::test_health_check`
- **Database Migrations:** Tables are automatically created via `models.Base.metadata.create_all(bind=engine)` in `main.py`.
- **Database Path:** Defaults to `backend/traffic_nexus.db` (SQLite) for local development unless `DATABASE_URL` is set.

### Frontend (React/TypeScript/Vite)
The frontend is located in the `frontend/` directory.

- **Setup:** `npm install` (run from `frontend/`)
- **Development Server:** `npm run dev` (starts on port 3000 as per `vite.config.ts`)
- **Build:** `npm run build`
- **Type Checking:** `npx tsc`
- **Linting:** Standard TypeScript rules apply. Follow the patterns in `frontend/services/db.ts`.

### Docker
- **Up:** `docker-compose up --build`
- **Down:** `docker-compose down`

---

## 2. Code Style Guidelines

### General Principles
- **Consistency:** Rigorously adhere to existing naming and structural patterns.
- **Explicitness:** Prefer explicit types (`string`, `number`, `User`) over `any`.
- **Modularity:** Keep components and functions focused on a single responsibility.

### Backend (Python)
- **Framework:** FastAPI with Pydantic v2 for request/response validation.
- **ORM:** SQLAlchemy (Declarative Base).
- **Imports Order:**
    1. Standard library (`os`, `json`, `datetime`, `uuid`)
    2. Third-party packages (`fastapi`, `sqlalchemy`, `pydantic`)
    3. Local modules (`import models`, `from database import get_db`)
- **Naming:**
    - Functions/Variables: `snake_case` (e.g., `get_current_user`)
    - Classes/Models/Schemas: `PascalCase` (e.g., `UserCreate`, `ProjectResponse`)
    - SQL Tables/Columns: `snake_case`
- **Error Handling:** Use `fastapi.HTTPException` with clear detail messages. 
    - `400`: Validation/Logic errors.
    - `401`: Authentication failures.
    - `403`: Permission/Role issues.
    - `404`: Resource not found.
- **Authentication:** Hybrid system supporting JWT (Bearer) and `X-API-KEY` headers. Use the `get_current_user` dependency.

### Frontend (React/TypeScript)
- **Framework:** React 19 with Vite and React Router DOM v7.
- **Components:** Functional components with Arrow Functions. Use `React.FC` when appropriate.
- **Naming:**
    - Component Files: `PascalCase.tsx` (e.g., `Dashboard.tsx`)
    - Styles: Tailwind CSS or plain CSS modules.
    - Local Variables/Functions: `camelCase` (e.g., `handleLogin`)
- **Data Fetching:**
    - Centralized in `frontend/services/db.ts`.
    - Always use `fetchWithAuth` for protected resources.
    - Handle 401 responses by dispatching the `auth-expired` event.
- **State Management:** 
    - Local state: `useState`, `useEffect`.
    - Persistence: `localStorage` for tokens and user profiles.
    - Caching: Use `modus_projects_cache` style keys for offline-first behavior.
- **Types:** Centralized in `frontend/types.ts`. Reuse interfaces like `User`, `Project`, and `Transaction`.

---

## 3. Directory Structure

- `backend/`: Core FastAPI app.
    - `main.py`: Entry point, middleware, and all API endpoints.
    - `models.py`: SQLAlchemy models.
    - `database.py`: Session and engine configuration.
    - `enhanced_scheduler.py`: Background task orchestration.
    - `enhanced_hit_emulator.py`: Traffic simulation logic.
    - `tests/`: Pytest suite.
- `frontend/`: React source code.
    - `components/`: UI organized by domain (`admin/`, `landing/`, `blog/`).
    - `services/`: API wrappers (`db.ts`, `firebase.ts`).
    - `types.ts`: TypeScript definitions.
- `docker-compose.yml`: Local Postgres + Backend stack.

---

## 4. Key Patterns & "Gotchas"

- **Hybrid Auth:** Endpoints often allow either a JWT token or an API key. Check `get_current_user` in `main.py`.
- **JSON Settings:** The `Project` model has a `settings` field (JSON/JSONB). It must strictly map to the `ProjectSettings` interface in `types.ts`.
- **SSE Analytics:** Real-time pulse data uses Server-Sent Events via `/admin/live-pulse`.
- **UUIDs:** Most primary keys are strings containing UUIDs, generated via `uuid.uuid4`.
- **Environment Variables:**
    - `JWT_SECRET_KEY`: Required for security.
    - `ALLOWED_ORIGINS`: Used for CORS config.
    - `DATABASE_URL`: Set this to use Postgres; otherwise, SQLite is used.

---

## 5. Guidelines for AI Agents

- **Incremental Changes:** When adding a field to a model, ensure you update the corresponding Pydantic schema AND the frontend TypeScript interface.
- **Database Safety:** Always use `get_db` with context management (Depends) in FastAPI.
- **Frontend Sync:** The `db.ts` service often caches data in `localStorage`. If you modify a backend response, ensure `syncProjects` or similar functions in `db.ts` handle the new data.
- **Cursor/Copilot Rules:** No explicit `.cursorrules` or `.github/copilot-instructions.md` were detected. Follow the established patterns in `main.py` and `db.ts`.

---

*Revision: 2026-01-29 | Target: Agentic Coding Assistants*
