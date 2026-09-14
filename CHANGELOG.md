# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2026-09-14

### Added

#### Authentication System
- User registration with email + username + password
- JWT-based login with access and refresh tokens
- Token refresh mechanism
- Password change with current password verification
- First registered user automatically becomes admin

#### Application Management
- Create, read, update, delete applications
- Auto-generated app IDs and secrets
- App secret regeneration
- Per-app statistics (license counts, activations)

#### License System
- Single and bulk license generation
- License types: time-limited, lifetime, trial
- HWID binding (hardware lock)
- License states: active, expired, banned, unused
- License verification endpoint
- Ban/unban licenses
- License export as text file
- Pagination, search, and filtering

#### Client Activation & Update
- Client activation with license key + HWID
- Activation token generation and verification
- Version management with file upload
- Auto-update check endpoint
- Forced update support with grace period
- SHA-256 checksum verification for uploads
- File download endpoint

#### V2 Protocol (KeyAuth/Authly Compatible)
- Session handshake with anti-tamper hash checking
- License-based client login
- App user registration and login
- Session heartbeat validation
- Cloud variable get/set
- Client telemetry logging
- HWID reset
- In-app chat and announcements

#### Dashboard UI
- Dark theme with glassmorphism design
- Dashboard overview with statistics
- Application management (CRUD)
- License management with bulk operations
- Version management with file upload
- App user management (ban/unban)
- Cloud variable management
- Blacklist engine (HWID/IP)
- Webhook management with Discord support
- Audit log viewer with filters
- Client activation portal
- Landing page with SDK showcase
- Responsive design (mobile-friendly)

#### SDKs (14 Languages)
- C#, C++, Python, Java, JavaScript/TypeScript
- PHP, Rust, Go, Lua, Ruby, Perl
- React, Vue, Unity

#### Security
- bcrypt password hashing
- JWT with configurable expiry
- CORS middleware with configurable origins
- Rate limiting (general, auth, client tiers)
- Helmet HTTP security headers
- HMAC signature verification
- Audit logging for all operations
- Input validation

#### Deployment
- Docker + Docker Compose support
- SQLite dev mode (zero-dependency)
- Vercel serverless support
- Environment-based configuration
- Deployment guides for Render, Railway, Fly.io, Vercel

### Security

- All secrets configurable via environment variables
- No hardcoded credentials in production code
- Rate limiting on authentication endpoints
- Input validation on all API endpoints
- CORS protection on all routes
