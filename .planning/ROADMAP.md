# DARK-AUTH Roadmap

## Current Milestone: Phase 9 - Testing & CI/CD

## Phase 1 - Foundation & Database
Setup project structure, Docker config, database schema, Prisma models, Prisma Migrate.
- **Reqs**: R9.1, R9.2, R9.3 (partial)
- **UAT**: Docker compose up creates DB, tables exist
- **Status**: Implemented

## Phase 2 - Authentication System
User registration, login, JWT, bcrypt, auth middleware.
- **Reqs**: R1.1-R1.6, R6.1-R6.4, R7.1, R7.2, R7.7
- **UAT**: Can register, login, get JWT, access protected routes
- **Status**: Implemented

## Phase 3 - Application System
App CRUD, app secrets, statistics.
- **Reqs**: R2.1-R2.5, R6.5-R6.9
- **UAT**: Can create/list/update/delete apps
- **Status**: Implemented

## Phase 4 - License System
License generation, verification, HWID binding, states, bulk generation.
- **Reqs**: R3.1-R3.10, R6.10-R6.15
- **UAT**: Can generate, verify, bind, ban licenses
- **Status**: Implemented

## Phase 5 - Client Activation & Updates
Activation flow, version management, update check, downloads.
- **Reqs**: R4.1-R4.8, R6.16-R6.21
- **UAT**: Client can activate, check updates, download
- **Status**: Implemented

## Phase 6 - Security & Logging
Rate limiting, CORS, HMAC, audit logging, secure headers.
- **Reqs**: R7.3-R7.8, R8.1-R8.5, R6.22
- **UAT**: Rate limits enforce, logs captured, HMAC utilities in place (enforcement pending R16.1)
- **Status**: Implemented

## Phase 7 - Dashboard UI
Full frontend with all management pages, modern dark design.
- **Reqs**: R5.1-R5.9, R6.23
- **UAT**: All dashboard pages functional, responsive
- **Status**: Implemented

## Phase 8 - Example Client SDK & Deployment
Python example client, SDKs (Python, JS, React, Vue), partial deployment setup.
- **Reqs**: R10.1-R10.8, R9.1-R9.3
- **UAT**: Example client runs, SDKs published, Docker compose works
- **Status**: Satisfactory (SDK complete; deployment guides R9.4-R9.6 deferred to Phase 10, CI/CD R9.7 deferred to Phase 9)

## Phase 9 - Testing & CI/CD
Set up test frameworks, write test suites for backend and frontend, and establish CI/CD pipeline with GitHub Actions.
- **Reqs**: R11.1-R11.4, R12.1-R12.6, R13.1-R13.3, R14.1-R14.4
- **UAT**: `npm test` runs all tests with >=80% pass rate; GitHub Actions CI passes on PR; Docker build succeeds
- **Status**: Not started

## Phase 10 - Documentation & Security
Rewrite README, create deployment guides, generate API documentation, and enforce HMAC signature validation on v2 API routes.
- **Reqs**: R15.1-R15.5, R16.1-R16.2, R9.4-R9.6
- **UAT**: README describes DARK-AUTH; deployment guides work end-to-end; API docs published; HMAC middleware active on /api/v2
- **Status**: Not started

## Summary

| Phase | Name | Status |
|-------|------|--------|
| Phase 1 | Foundation & Database | Implemented |
| Phase 2 | Authentication System | Implemented |
| Phase 3 | Application System | Implemented |
| Phase 4 | License System | Implemented |
| Phase 5 | Client Activation & Updates | Implemented |
| Phase 6 | Security & Logging | Implemented |
| Phase 7 | Dashboard UI | Implemented |
| Phase 8 | Example Client SDK & Deployment | Satisfactory |
| Phase 9 | Testing & CI/CD | Not started |
| Phase 10 | Documentation & Security | Not started |
