# DARK-AUTH

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20+-green)
![React](https://img.shields.io/badge/react-18-blue)
![Prisma](https://img.shields.io/badge/prisma-6+-purple)
[![CI](https://github.com/mahdi2372/dark-auth/actions/workflows/ci.yml/badge.svg)](https://github.com/mahdi2372/dark-auth/actions/workflows/ci.yml)
[![GitHub issues](https://img.shields.io/github/issues/mahdi2372/dark-auth)](https://github.com/mahdi2372/dark-auth/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/mahdi2372/dark-auth)](https://github.com/mahdi2372/dark-auth/pulls)
[![GitHub stars](https://img.shields.io/github/stars/mahdi2372/dark-auth)](https://github.com/mahdi2372/dark-auth/stargazers)

**Complete, Free, Self-Hosted Authentication, Licensing & Client Activation Platform**

A full-featured, open-source alternative to KeyAuth, AuthlyX, and RedKey — featuring zero paywalls, instant zero-dependency local running (SQLite dev mode), Docker support, multi-tier licensing, cloud variables, blacklist engine, Webhook notifications, a dedicated client activation portal, and client SDKs across 14 programming languages.

---

## Features

### Authentication & Licensing
- User registration, login, JWT auth with refresh tokens
- Application management with auto-generated IDs and secrets
- License key generation (single and bulk) with types: time-limited, lifetime, trial
- HWID binding (hardware lock) for license enforcement
- License states: active, expired, banned, unused
- License verification, ban/unban, export

### Client Activation & Updates
- Client activation with license key + HWID
- Version management with file upload
- Auto-update check endpoint with forced update support
- SHA-256 checksum verification
- Dedicated client activation portal (RedKey-style)

### V2 Protocol (KeyAuth/Authly Compatible)
- Session handshake with anti-tamper hash checking
- License-based client login
- App user registration and login
- Cloud variable get/set
- Client telemetry logging
- HWID reset
- In-app chat and announcements

### Security
- bcrypt password hashing (cost 12)
- JWT with configurable expiry
- CORS, rate limiting, Helmet security headers
- HMAC signature verification
- Blacklist engine (HWID/IP blocking)
- Discord & Slack webhook notifications
- Comprehensive audit logging

### Dashboard
- Dark theme with modern glassmorphism design
- Application, license, version management
- Cloud variables, blacklist, webhooks management
- Audit log viewer with filters
- Responsive design (mobile-friendly)

### SDKs (14 Languages)
C#, C++, Python, Java, JavaScript/TypeScript, PHP, Rust, Go, Lua, Ruby, Perl, React, Vue, Unity

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Backend

```bash
cd backend
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### Default Credentials

| Field | Value |
|-------|-------|
| Email | `admin@darkauth.local` |
| Username | `admin` |
| Password | `admin123` |

> The first registered user automatically becomes ADMIN.

### Docker

```bash
docker compose up --build -d
```

Dashboard: `http://localhost:3000` | API: `http://localhost:5000`

---

## API Reference

### Dashboard API (`/api`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login |
| `/api/auth/refresh` | POST | No | Refresh access token |
| `/api/auth/me` | GET | Yes | Get profile |
| `/api/apps` | GET/POST | Yes | List/create applications |
| `/api/apps/:id` | PUT/DELETE | Yes | Update/delete application |
| `/api/licenses` | GET/POST | Yes | List/create licenses |
| `/api/licenses/bulk` | POST | Yes | Bulk create licenses |
| `/api/licenses/verify` | POST | No | Verify license key |
| `/api/licenses/:id/ban` | PUT | Yes | Ban license |
| `/api/licenses/:id/unban` | PUT | Yes | Unban license |
| `/api/client/activate` | POST | No | Client activation |
| `/api/client/verify-activation` | POST | No | Verify activation token |
| `/api/client/check-update` | GET | No | Check for updates |
| `/api/client/versions` | GET/POST | Yes | List/create versions |
| `/api/client/download/:id` | GET | No | Download version file |
| `/api/logs` | GET | Yes | Audit logs |
| `/api/dashboard/stats` | GET | Yes | Dashboard statistics |
| `/api/cloud-variables` | GET/POST | Yes | Manage cloud variables |
| `/api/blacklist` | GET/POST | Yes | Manage blacklist |
| `/api/webhooks` | GET/POST | Yes | Manage webhooks |
| `/api/webhooks/test/:id` | POST | Yes | Test webhook delivery |

### V2 Protocol API (`/api/v2`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/init` | POST | Session handshake |
| `/api/v2/license` | POST | License login |
| `/api/v2/login` | POST | App user login |
| `/api/v2/register` | POST | App user registration |
| `/api/v2/check` | POST | Session heartbeat |
| `/api/v2/var/get` | POST | Get cloud variable |
| `/api/v2/var/set` | POST | Set cloud variable |
| `/api/v2/log` | POST | Client telemetry |
| `/api/v2/hwid/reset` | POST | Reset HWID lock |
| `/api/v2/chat` | GET/POST | Chat messages |

---

## SDKs

All SDKs are in the [`sdk/`](./sdk) directory:

| Language | File |
|----------|------|
| C# | `sdk/csharp/DarkAuth.cs` |
| C++ | `sdk/cpp/DarkAuth.hpp` |
| Python | `sdk/python/darkauth.py` |
| Java | `sdk/java/DarkAuth.java` |
| JavaScript/TypeScript | `sdk/javascript/darkauth.js` |
| PHP | `sdk/php/DarkAuth.php` |
| Rust | `sdk/rust/src/lib.rs` |
| Go | `sdk/go/darkauth.go` |
| Lua | `sdk/lua/darkauth.lua` |
| Ruby | `sdk/ruby/darkauth.rb` |
| Perl | `sdk/perl/DarkAuth.pm` |
| React | `sdk/react/useDarkAuth.jsx` |
| Vue | `sdk/vue/useDarkAuth.js` |
| Unity | `sdk/unity/DarkAuthUnity.cs` |

---

## Project Structure

```
DARK-AUTH/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── config.js     # Environment configuration
│   │   ├── index.js      # Entry point
│   │   ├── middleware/    # Auth, security, rate limiting
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities (JWT, password, keygen)
│   └── prisma/           # Database schema and seed
├── frontend/             # React + Vite dashboard
│   └── src/
│       ├── api/           # API client
│       ├── components/    # Reusable components
│       ├── context/       # React context (auth)
│       ├── pages/         # Page components
│       └── styles/        # CSS
├── sdk/                  # Client SDKs (14 languages)
├── example-client/       # Python example client
└── .github/              # CI/CD and templates
```

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup
- Coding standards
- Pull request process
- Commit message format

---

## Security

For reporting security vulnerabilities, please see our [Security Policy](SECURITY.md).

**Do NOT report security vulnerabilities through public GitHub issues.**

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guides:

- Docker Compose (local development)
- Render.com (free tier)
- Railway (free tier)
- Fly.io (free tier)
- Vercel (frontend only)

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Inspired by [KeyAuth](https://keyauth.win), [AuthlyX](https://authlyx.com), and [RedKey](https://redkey.pages.dev)
- Built with Express.js, React, Prisma, and PostgreSQL
- 14 client SDKs covering major languages and frameworks
