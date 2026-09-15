# Roadmap: DARK-AUTH

## Overview

A complete, free, self-hosted authentication, licensing, and client activation platform inspired by KeyAuth. Built on Node.js/Express/Prisma/React, deployable on free hosting tiers. Phases 1-8 (Foundation) are complete; Milestone 2 focuses on quality assurance and documentation.

## Phases

- [x] **Phase 1: Foundation & Database** - Project structure, Docker, Prisma schema, database models
- [x] **Phase 2: Authentication System** - User registration, login, JWT, bcrypt, auth middleware
- [x] **Phase 3: Application System** - App CRUD, secrets, statistics
- [x] **Phase 4: License System** - Generation, verification, HWID binding, states, bulk
- [x] **Phase 5: Client Activation & Updates** - Activation flow, version management, auto-update
- [x] **Phase 6: Security & Logging** - Rate limiting, CORS, Helmet, audit logging
- [x] **Phase 7: Dashboard UI** - React dashboard with all management pages
- [x] **Phase 8: Example Client SDK & Deployment** - SDKs (Python/JS/React/Vue), example client, Docker
- [ ] **Phase 9: Testing & CI/CD** - Test frameworks, test suites, GitHub Actions pipeline
- [ ] **Phase 10: Documentation & Security** - README rewrite, deployment guides, API docs, HMAC enforcement

## Phase Details

### Phase 1: Foundation & Database
**Goal**: Database schema, Docker setup, Prisma models, configuration
**Depends on**: Nothing (first phase)
**Requirements**: [R9.1, R9.2, R9.3]
**Success Criteria** (what must be TRUE):
  1. Docker compose up creates the database and all tables exist
  2. Prisma client generates successfully from schema
  3. Server starts and health check endpoint responds
**Plans**: 0 plans (complete)

### Phase 2: Authentication System
**Goal**: User registration, login, JWT tokens, bcrypt, auth middleware
**Depends on**: Phase 1
**Requirements**: [R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R6.1, R6.2, R6.3, R6.4, R7.1, R7.2, R7.7]
**Success Criteria** (what must be TRUE):
  1. Can register a new user account
  2. Can login and receive a JWT token
  3. Protected routes reject requests without valid tokens
**Plans**: 0 plans (complete)

### Phase 3: Application System
**Goal**: Create, list, update, delete applications with unique IDs and secrets
**Depends on**: Phase 2
**Requirements**: [R2.1, R2.2, R2.3, R2.4, R2.5, R6.5, R6.6, R6.7, R6.8, R6.9]
**Success Criteria** (what must be TRUE):
  1. Can create/list/update/delete applications via dashboard
  2. Apps have auto-generated appId and appSecret
  3. App deletion cascades to licenses
**Plans**: 0 plans (complete)

### Phase 4: License System
**Goal**: License generation, verification, HWID binding, states, bulk creation
**Depends on**: Phase 3
**Requirements**: [R3.1, R3.2, R3.3, R3.4, R3.5, R3.6, R3.7, R3.8, R3.9, R3.10, R6.10, R6.11, R6.12, R6.13, R6.14, R6.15]
**Success Criteria** (what must be TRUE):
  1. Can generate single and bulk licenses
  2. Can verify licenses via public API
  3. Can bind licenses to HWID and ban/unban
**Plans**: 0 plans (complete)

### Phase 5: Client Activation & Updates
**Goal**: Client activation flow, version management, update checking, file downloads
**Depends on**: Phase 4
**Requirements**: [R4.1, R4.2, R4.3, R4.4, R4.5, R4.6, R4.7, R4.8, R6.16, R6.17, R6.18, R6.19, R6.20, R6.21]
**Success Criteria** (what must be TRUE):
  1. Client can activate with a license key and receive an activation token
  2. Client can check for updates and receive latest version metadata
  3. Client can download version files
**Plans**: 0 plans (complete)

### Phase 6: Security & Logging
**Goal**: Rate limiting, CORS, Helmet, HMAC utilities, audit logging, secure headers
**Depends on**: Phase 5
**Requirements**: [R7.3, R7.4, R7.5, R7.6, R7.8, R8.1, R8.2, R8.3, R8.4, R8.5, R6.22]
**Success Criteria** (what must be TRUE):
  1. Rate limits enforce on auth and client endpoints
  2. Audit logs capture API actions with IP, timestamp, user_id
  3. Secure headers are applied via Helmet middleware
**Plans**: 0 plans (complete)

### Phase 7: Dashboard UI
**Goal**: Full React dashboard with all management pages and modern dark design
**Depends on**: Phase 6
**Requirements**: [R5.1, R5.2, R5.3, R5.4, R5.5, R5.6, R5.7, R5.8, R5.9, R6.23]
**Success Criteria** (what must be TRUE):
  1. All dashboard pages are functional (apps, licenses, versions, logs, settings)
  2. UI is responsive and works on mobile
  3. Dark theme with modern, premium design
**Plans**: 0 plans (complete)

### Phase 8: Example Client SDK & Deployment
**Goal**: SDKs for Python/JS/React/Vue, example client, Docker Compose, partial deployment
**Depends on**: Phase 7
**Requirements**: [R10.1, R10.2, R10.3, R10.4, R10.5, R10.6, R10.7, R10.8, R9.1, R9.2, R9.3]
**Success Criteria** (what must be TRUE):
  1. Example Python client runs and demonstrates activation, verify, update check
  2. SDKs published: Python (requests), JavaScript (fetch), React hook, Vue composable
  3. Docker compose starts the full stack
**Plans**: 0 plans (complete; deployment guides R9.4-R9.6 deferred to Phase 10, CI/CD R9.7 deferred to Phase 9)

### Phase 9: Testing & CI/CD
**Goal**: Set up test frameworks, write test suites, and establish CI/CD pipeline
**Depends on**: Phase 8
**Requirements**: [R11.1, R11.2, R11.3, R11.4, R12.1, R12.2, R12.3, R12.4, R12.5, R12.6, R13.1, R13.2, R13.3, R14.1, R14.2, R14.3, R14.4]
**Success Criteria** (what must be TRUE):
  1. `npm test` runs all tests with >=80% pass rate
  2. GitHub Actions CI passes on all PRs (lint + test + build)
  3. Docker build succeeds in CI pipeline
**Plans**: TBD - to be created during plan-phase

Plans:
- [ ] 09-01: Testing infrastructure (Jest + Vitest setup, test DB)
- [ ] 09-02: Backend test suite (auth, apps, licenses, client API, features, security)
- [ ] 09-03: Frontend test suite (auth context, API client, component smoke tests)
- [ ] 09-04: CI/CD pipeline (GitHub Actions, Docker build, security audit)

### Phase 10: Documentation & Security
**Goal**: Rewrite documentation, create deployment guides, API docs, and enforce HMAC validation
**Depends on**: Phase 9
**Requirements**: [R15.1, R15.2, R15.3, R15.4, R15.5, R16.1, R16.2, R9.4, R9.5, R9.6]
**Success Criteria** (what must be TRUE):
  1. README.md accurately describes DARK-AUTH (not Koyeb CLI)
  2. Deployment guides for Render, Railway, Fly.io, Vercel work end-to-end
  3. API reference documentation published
  4. HMAC middleware active on /api/v2 routes
**Plans**: TBD - to be created during plan-phase

Plans:
- [ ] 10-01: README rewrite and PROJECT.md sync
- [ ] 10-02: Deployment guides (Render, Railway, Fly.io, Vercel)
- [ ] 10-03: API reference documentation
- [ ] 10-04: HMAC signature validation enforcement on v2 routes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Database | v1.0 | 0/0 | Complete | - |
| 2. Authentication System | v1.0 | 0/0 | Complete | - |
| 3. Application System | v1.0 | 0/0 | Complete | - |
| 4. License System | v1.0 | 0/0 | Complete | - |
| 5. Client Activation & Updates | v1.0 | 0/0 | Complete | - |
| 6. Security & Logging | v1.0 | 0/0 | Complete | - |
| 7. Dashboard UI | v1.0 | 0/0 | Complete | - |
| 8. Example Client SDK & Deployment | v1.0 | 0/0 | Complete | - |
| 9. Testing & CI/CD | v1.1 | 0/4 | Not started | - |
| 10. Documentation & Security | v1.1 | 0/4 | Not started | - |

## Milestone Groupings

- [x] **v1.0 MVP** - Phases 1-8 (shipped)
- [ ] **v1.1 Quality & Scale** - Phases 9-10 (in progress)

<details>
<summary>v1.0 MVP (Phases 1-8) - SHIPPED</summary>

Phases 1-8 delivered the complete authentication, licensing, and client activation platform.

</details>

### v1.1 Quality & Scale (In Progress)

**Milestone Goal:** Bring the platform to production-ready status with test coverage, CI/CD automation, comprehensive documentation, and security hardening.

#### Phase 9: Testing & CI/CD
