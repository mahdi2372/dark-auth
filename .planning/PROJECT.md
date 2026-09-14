# DARK-AUTH — Self-Hosted Authentication, Licensing & Client Activation Platform

## Vision
A **complete, free, self-hosted** authentication, licensing, and client activation platform inspired by KeyAuth and RedKey USB activation flows. Built entirely with open-source technologies, deployable on free hosting tiers.

## Problem Statement
Commercial licensing/authentication platforms (KeyAuth, Cryptlex, Keygen) charge fees and create vendor lock-in. Developers need a free, self-hostable alternative with the same feature depth: user accounts, app management, license generation/verification, hardware binding, client activation, and auto-update infrastructure.

## Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | **FastAPI** (Python 3.11+) | High-performance async, auto-docs, type-safe |
| Database | **PostgreSQL** (via SQLAlchemy async) | Production-grade, free on Render/Railway |
| ORM | **SQLAlchemy 2.0** + Alembic | Async ORM, migration support |
| Auth | **JWT** (PyJWT) + **bcrypt** | Industry standard, zero cost |
| Frontend | **Vanilla HTML/CSS/JS** | No build step, instant deployment |
| Deployment | **Docker** + **Docker Compose** | Portable, reproducible |
| Free Hosts | Render, Railway, Fly.io, Vercel | All have free tiers |

## Core Modules
1. **Account System** — Register, login, JWT auth, bcrypt
2. **Application System** — Create/manage apps with unique IDs and secrets
3. **License System** — Generate keys, expiration, HWID bind, states (active/expired/banned)
4. **Client Activation & Update** — Activation endpoint, version API, release notes, auto-update
5. **Dashboard UI** — Full management interface
6. **Audit Logging** — IP, timestamp, action logging
7. **Security** — Rate limiting, CORS, HMAC validation, parameterized queries

## Non-Goals (v1)
- Payment integration (Stripe, etc.)
- Multi-tenant white-labeling
- Mobile native SDKs

## Team
- Solo developer / self-hosted operator
