# DARK-AUTH Requirements

> Status Legend:
> - R1-R8: Largely satisfied by the current Node.js/Express/Prisma/React implementation.
> - R9.1-R9.3: Docker + Docker Compose setup implemented.
> - R9.4-R9.6: Deployment guides NOT yet implemented (deferred to Phase 10).
> - R9.7: GitHub Actions CI/CD NOT yet implemented (deferred to Phase 9).
> - R10: Example Client SDK and language SDKs (Python, JS, React, Vue) implemented.
> - R11-R16: New requirements for Milestone 2 (Quality & Scale).

## R1 - Account System
- **R1.1**: User registration with email + username + password
- **R1.2**: Password hashing with bcrypt (cost factor 12)
- **R1.3**: JWT-based login with configurable expiration
- **R1.4**: Token refresh mechanism
- **R1.5**: User profile retrieval
- **R1.6**: Admin vs regular user roles

## R2 - Application System
- **R2.1**: Create applications with auto-generated app_id and app_secret
- **R2.2**: List all apps for authenticated user
- **R2.3**: Update application metadata (name, description)
- **R2.4**: Delete applications (cascade licenses)
- **R2.5**: App-level statistics (total licenses, active, expired)

## R3 - License System
- **R3.1**: Generate license keys (UUID-based or custom format)
- **R3.2**: License types: time-limited, lifetime, trial
- **R3.3**: Set expiration duration (days/hours) or lifetime
- **R3.4**: Optional HWID binding (hardware lock)
- **R3.5**: License states: active, expired, banned, unused
- **R3.6**: Bulk license generation
- **R3.7**: License verification endpoint (public API)
- **R3.8**: License activation (first-use binding)
- **R3.9**: Ban/unban licenses
- **R3.10**: License usage logging (IP, timestamp, HWID)

## R4 - Client Activation & Update System
- **R4.1**: Client activation endpoint (validates license -> issues activation token)
- **R4.2**: Activation token verification
- **R4.3**: Upload/register new client versions
- **R4.4**: Get latest version metadata (version, download_url, checksum, release_notes)
- **R4.5**: Version history API
- **R4.6**: Client auto-update check endpoint (current_version -> needs_update?)
- **R4.7**: Release notes per version
- **R4.8**: File download endpoint for client binaries

## R5 - Dashboard UI
- **R5.1**: Login and registration pages
- **R5.2**: Dashboard overview (stats, recent activity)
- **R5.3**: Application management (CRUD)
- **R5.4**: License management table (filter, search, generate, ban)
- **R5.5**: Client version management (upload, list, release notes)
- **R5.6**: Activation log viewer
- **R5.7**: User settings page
- **R5.8**: Dark theme, modern, premium design
- **R5.9**: Responsive (mobile-friendly)

## R6 - API Endpoints
- **R6.1**: `POST /api/auth/register`
- **R6.2**: `POST /api/auth/login`
- **R6.3**: `POST /api/auth/refresh`
- **R6.4**: `GET /api/auth/me`
- **R6.5**: `POST /api/apps` (create)
- **R6.6**: `GET /api/apps` (list)
- **R6.7**: `GET /api/apps/{id}` (detail)
- **R6.8**: `PUT /api/apps/{id}` (update)
- **R6.9**: `DELETE /api/apps/{id}` (delete)
- **R6.10**: `POST /api/licenses` (create)
- **R6.11**: `POST /api/licenses/bulk` (bulk create)
- **R6.12**: `GET /api/licenses` (list, filter by app)
- **R6.13**: `POST /api/licenses/verify` (public)
- **R6.14**: `PUT /api/licenses/{id}/ban`
- **R6.15**: `PUT /api/licenses/{id}/unban`
- **R6.16**: `POST /api/client/activate` (public)
- **R6.17**: `GET /api/client/check-update`
- **R6.18**: `GET /api/client/latest-version/{app_id}`
- **R6.19**: `GET /api/client/versions/{app_id}`
- **R6.20**: `POST /api/client/versions` (upload new version)
- **R6.21**: `GET /api/client/download/{version_id}`
- **R6.22**: `GET /api/logs` (audit logs)
- **R6.23**: `GET /api/dashboard/stats`

## R7 - Security
- **R7.1**: bcrypt password hashing (cost 12)
- **R7.2**: JWT with HS256, configurable expiry (default 24h)
- **R7.3**: HMAC signature validation for client API calls (utility implemented, enforcement pending R16.1)
- **R7.4**: CORS middleware (configurable origins)
- **R7.5**: Rate limiting via express-rate-limit - 100/min general, 10/min auth, 30/min client
- **R7.6**: SQL injection prevention via Prisma ORM parameterized queries
- **R7.7**: Input validation via middleware (Joi/Zod-style validation)
- **R7.8**: Secure headers middleware (Helmet)

## R8 - Logging & Audit
- **R8.1**: Log all API actions with IP, timestamp, user_id, action
- **R8.2**: License verification logging
- **R8.3**: Client activation logging
- **R8.4**: Login attempt logging (success/failure)
- **R8.5**: Filterable log viewer in dashboard

## R9 - Deployment
- **R9.1**: Docker + Docker Compose setup
- **R9.2**: Environment variable configuration
- **R9.3**: PostgreSQL containerized for local dev
- **R9.4**: Deployment guide for Render.com (NOT IMPLEMENTED - deferred to Phase 10)
- **R9.5**: Deployment guide for Railway (NOT IMPLEMENTED - deferred to Phase 10)
- **R9.6**: Deployment guide for Fly.io (NOT IMPLEMENTED - deferred to Phase 10)
- **R9.7**: GitHub Actions CI/CD pipeline (NOT IMPLEMENTED - deferred to Phase 9)

## R10 - Example Client SDK
- **R10.1**: Python example client demonstrating activation
- **R10.2**: Python example client demonstrating license verify
- **R10.3**: Python example client demonstrating update check
- **R10.4**: HWID collection utility
- **R10.5**: Full client integration example
- **R10.6**: JavaScript SDK (fetch-based)
- **R10.7**: React hook SDK (useDarkAuth)
- **R10.8**: Vue composable SDK

## R11 - Testing Infrastructure
- **R11.1**: Jest test framework configured for backend (jest.config.js with supertest)
- **R11.2**: Vitest configured for frontend test runner
- **R11.3**: Test database isolation (in-memory SQLite for unit tests, separate PostgreSQL for integration)
- **R11.4**: Test configuration via environment (.env.test or jest/vitest setup files)

## R12 - Backend Test Suite
- **R12.1**: Auth route tests - register, login, refresh, /me
- **R12.2**: Application CRUD tests - create, list, get, update, delete
- **R12.3**: License tests - generate, bulk generate, verify, ban/unban, HWID binding
- **R12.4**: Client API tests - activate, verify-activation, check-update, download
- **R12.5**: Feature route tests - cloud variables, blacklist, webhooks, app-users
- **R12.6**: Security tests - rate limiting, JWT auth rejection, ownership enforcement

## R13 - Frontend Test Suite
- **R13.1**: Auth context tests - login, register, token storage, logout
- **R13.2**: API client module tests (frontend/src/api/client.js)
- **R13.3**: Component smoke tests - Login, Dashboard, Apps, Licenses pages render correctly

## R14 - CI/CD Pipeline
- **R14.1**: GitHub Actions workflow - lint + test + build on every PR
- **R14.2**: Docker image build and push to registry on main branch merge
- **R14.3**: Security audit step (npm audit, Snyk, or Trivy in CI)
- **R14.4**: Status badge in README

## R15 - Documentation
- **R15.1**: Rewrite README.md to describe DARK-AUTH (currently incorrectly describes Koyeb CLI)
- **R15.2**: Update PROJECT.md tech stack to reflect Node.js/Express/Prisma/React
- **R15.3**: Deployment guides - Render.com, Railway, Fly.io, Vercel
- **R15.4**: API reference documentation (OpenAPI/Swagger spec)
- **R15.5**: SDK usage documentation (Python, JavaScript, React, Vue)

## R16 - Security Enhancement (HMAC Enforcement)
- **R16.1**: HMAC signature validation middleware on v2 API routes (KeyAuth-compatible handshake)
- **R16.2**: Add request signing utility to Python and JavaScript SDKs
