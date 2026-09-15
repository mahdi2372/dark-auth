# DARK-AUTH — Self-Hosted Authentication, Licensing & Client Activation Platform

## Vision
A **complete, free, self-hosted** authentication, licensing, and client activation platform inspired by KeyAuth. Built entirely with open-source technologies, deployable on free hosting tiers.

## Problem Statement
Commercial licensing/authentication platforms (KeyAuth, Cryptlex, Keygen) charge fees and create vendor lock-in. Developers need a free, self-hostable alternative with the same feature depth: user accounts, app management, license generation/verification, hardware binding, client activation, and auto-update infrastructure.

## Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | **Node.js 18+ + Express 4** | Async event loop, minimal overhead, large ecosystem |
| Database | **PostgreSQL** | Production-grade, free on Render/Railway |
| ORM | **Prisma 6** + Prisma Migrate | Type-safe, auto-generated types, migration support |
| Auth | **JWT** (jsonwebtoken) + **bcryptjs** | Industry standard, zero cost |
| Validation | Input validation middleware | Prevent injection, enforce contracts |
| Frontend | **React 18 + Vite** | Fast HMR, production-optimized builds |
| Routing | react-router-dom | SPA routing |
| UI | Custom CSS (dark theme) + lucide-react icons | Lightweight, no design system dependency |
| HTTP | axios | Frontend API client |
| Linting | ESLint 8 | Code quality, consistent style |
| SDKs | Python (requests), JavaScript (fetch), React hook, Vue composable | Multi-language client support |
| Deployment | **Docker** + **Docker Compose** | Portable, reproducible |
| Free Hosts | Render, Railway, Fly.io, Vercel | All have free tiers |

## Core Modules
1. **Account System** — Register, login, JWT auth, bcrypt, token refresh
2. **Application System** — Create/manage apps with unique IDs, secrets, hash-check anti-tamper
3. **License System** — Generate keys, expiration, HWID bind, states (unused/active/expired/banned), levels, bulk generation
4. **Client Activation & Update** — v2 KeyAuth-compatible init/licenseLogin/registerUser/loginUser, version management, auto-update, activation tokens
5. **Feature Extensions** — Cloud variables, blacklist (IP+HWID), webhooks (Discord), app users, in-app chat, app files
6. **Dashboard UI** — Full React dashboard with all management pages
7. **Audit Logging** — Action logging with IP, timestamp, user_agent, JSON details
8. **Security** — Rate limiting (express-rate-limit), CORS, Helmet, JWT auth, HMAC utilities
9. **SDKs** — Python, JavaScript, React hook, Vue composable
10. **Example Client** — Python example demonstrating activation, verify, update check

## Non-Goals (v1)
- Payment integration (Stripe, etc.)
- Multi-tenant white-labeling
- Mobile native SDKs

> Note: Test coverage, CI/CD automation, and comprehensive documentation were also v1 non-goals. They are now in scope for Milestone 2 (Quality & Scale).

## Milestone History

### Milestone 1: Foundations (Phases 1-8) - Completed
Built the full authentication, licensing, and client activation platform on the Node.js/Express/Prisma/React stack. Implemented:
- Account system with JWT/bcrypt auth
- Application management with secrets and anti-tamper hash checks
- License system with HWID binding, states, levels, bulk generation
- v2 KeyAuth-compatible API (init, licenseLogin, registerUser, loginUser, cloud variables, chat)
- Dashboard UI with all management pages (dark theme, responsive)
- Feature extensions (cloud variables, blacklist, webhooks, app users, chat)
- SDKs: Python, JavaScript, React, Vue
- Example Python client

### Milestone 2: Quality & Scale (Phases 9-10) - Current
Adding test coverage, CI/CD pipeline, documentation, and HMAC enforcement to bring the platform to production-ready status.

## Current Milestone Goals

### Phase 9: Testing & CI/CD
- Set up Jest (backend) and Vitest (frontend) test frameworks
- Write comprehensive test suites: auth, apps, licenses, client API, features, security
- Establish GitHub Actions CI/CD pipeline (lint, test, build, Docker)
- **Success criterion**: >90% test coverage, CI green on all PRs, Docker build succeeds

### Phase 10: Documentation & Security
- Rewrite README.md (currently incorrect - describes Koyeb CLI)
- Create deployment guides (Render, Railway, Fly.io, Vercel)
- Generate API reference documentation (OpenAPI/Swagger)
- Enforce HMAC signature validation on v2 API routes (R7.3)
- **Success criterion**: Documentation complete, security gap closed, HMAC middleware active on /api/v2

## Team
- Solo developer / self-hosted operator
