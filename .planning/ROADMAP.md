# DARK-AUTH Roadmap

## Phase 1 — Foundation & Database
Setup project structure, Docker config, database schema, SQLAlchemy models, Alembic migrations.
- **Reqs**: R9.1, R9.2, R9.3 (partial)
- **UAT**: Docker compose up creates DB, tables exist

## Phase 2 — Authentication System
User registration, login, JWT, bcrypt, auth middleware.
- **Reqs**: R1.1–R1.6, R6.1–R6.4, R7.1, R7.2, R7.7
- **UAT**: Can register, login, get JWT, access protected routes

## Phase 3 — Application System
App CRUD, app secrets, statistics.
- **Reqs**: R2.1–R2.5, R6.5–R6.9
- **UAT**: Can create/list/update/delete apps

## Phase 4 — License System
License generation, verification, HWID binding, states, bulk generation.
- **Reqs**: R3.1–R3.10, R6.10–R6.15
- **UAT**: Can generate, verify, bind, ban licenses

## Phase 5 — Client Activation & Updates
Activation flow, version management, update check, downloads.
- **Reqs**: R4.1–R4.8, R6.16–R6.21
- **UAT**: Client can activate, check updates, download

## Phase 6 — Security & Logging
Rate limiting, CORS, HMAC, audit logging, secure headers.
- **Reqs**: R7.3–R7.8, R8.1–R8.5, R6.22
- **UAT**: Rate limits enforce, logs captured, HMAC works

## Phase 7 — Dashboard UI
Full frontend with all management pages, modern dark design.
- **Reqs**: R5.1–R5.9, R6.23
- **UAT**: All dashboard pages functional, responsive

## Phase 8 — Example Client SDK & Deployment
Python example client, deployment guides, CI/CD.
- **Reqs**: R10.1–R10.5, R9.4–R9.7
- **UAT**: Example client runs, deployment docs complete
