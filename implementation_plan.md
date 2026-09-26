# Implementation Plan: Phase 7

## User Review Required
Please review this extensive plan for adding authentication, multi-currency support, migrations, CI, and deployment readiness.

## Proposed Changes

### 1. Multi-Currency Support (Backend & Frontend)
- Create `backend/app/services/currency.py` for standardizing exchange rates and conversion functions.
- Modify `financial_engine.py` to convert all event amounts to the user's `home_currency` before processing. If an event currency differs and no exchange rate is configured, return an unsupported error or drop event explicitly (per requirements).
- Update frontend components to use `Intl.NumberFormat` utilizing the `home_currency` from the profile instead of hardcoded `₹`.

### 2. User Authentication & Isolation
- Install `passlib`, `bcrypt`, `python-jose` (or `pyjwt`), `python-multipart`.
- Add `hashed_password` to `DBUser` in `backend/app/models/database.py`.
- Create `backend/app/api/auth.py` with endpoints `/register`, `/login`, `/me`.
- Implement a `get_current_user` dependency to protect all endpoints in `endpoints.py`.
- Ensure all DB queries filter by `user_id=current_user.id` to guarantee database isolation (403/404 on unowned records).

### 3. Migrations (Alembic)
- Initialize Alembic (`alembic init alembic`) in `backend/`.
- Configure `env.py` to point to `app.models.database.Base.metadata`.
- Generate the initial migration (`alembic revision --autogenerate -m "Initial schema"`).

### 4. Environment Configuration & CORS
- Update `backend/main.py` to read `CORS_ORIGINS` from env.
- Create `.env.example` in both `backend` and `frontend`.
- Expose `OPENAI_MODEL` to fallback properly.

### 5. File Upload Security
- Update `extract_document` to securely generate a random filename/UUID, reject empty files, and rigorously validate MIME types and sizes.

### 6. Frontend Auth Flow & UX
- Add `AuthContext.tsx` to hold JWT tokens and user state.
- Create `Login.tsx` and `Register.tsx`.
- Add a top-bar user indicator and logout button.
- Redirect `401` errors globally using an Axios interceptor in `api.ts`.

### 7. Documentation & CI
- Create `.github/workflows/ci.yml`.
- Write `docs/ARCHITECTURE.md`.
- Update `README.md` to reflect deployment-readiness, limitations, and auth features.

## Verification Plan
### Automated Tests
- Run `pytest` and add tests for currency conversion, auth boundaries, unsupported uploads, and database isolation.
### Manual Verification
- Register a new user, log in, view the dashboard (empty initially), and test the Buy or Wait simulation.
