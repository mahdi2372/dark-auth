# DARK-AUTH Deployment Guide

All deployment options below are **100% free**.

---

## 🐳 Local Docker (Development)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/dark-auth.git
cd dark-auth

# 2. Copy env file
cp .env.example .env
# Edit .env with your secrets

# 3. Start all services
docker compose up --build -d

# 4. Access
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# API Docs: http://localhost:5000/api/health
```

---

## 🚀 Render.com (Free Tier)

### Backend (Web Service)
1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm ci && npx prisma generate`
   - **Start Command**: `npx prisma db push --accept-data-loss && node src/index.js`
4. Add environment variables from `.env.example`

### Database (PostgreSQL)
1. New → **PostgreSQL**
2. Copy the **Internal Database URL**
3. Set `DATABASE_URL` in your backend service

### Frontend (Static Site)
1. New → **Static Site**
2. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
3. Add redirect rule: `/* → /index.html` (200)

---

## 🚂 Railway (Free Tier)

### One-Click Deploy
1. Go to [railway.app](https://railway.app) → **New Project**
2. Deploy from GitHub repo
3. Add **PostgreSQL** plugin
4. Set environment variables
5. Railway auto-detects Dockerfiles

### Manual Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add --plugin postgresql

# Deploy
railway up
```

---

## 🪁 Fly.io (Free Tier)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Backend
cd backend
fly launch --name dark-auth-api
fly secrets set DATABASE_URL="postgres://..." JWT_SECRET="..." HMAC_SECRET="..."
fly deploy

# Frontend
cd ../frontend
fly launch --name dark-auth-ui
fly deploy
```

### fly.toml (Backend)
```toml
[build]
  dockerfile = "Dockerfile"

[[services]]
  internal_port = 5000
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

---

## ▲ Vercel (Frontend Only)

Vercel is ideal for the React frontend:

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Select GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-url.onrender.com/api`

### vercel.json
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 🔄 GitHub Actions CI/CD

The included `.github/workflows/ci.yml` automatically:
1. Lints backend code
2. Builds Docker images
3. Runs on every push to `main`

---

## 🔑 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | JWT signing secret (64+ chars) |
| `JWT_EXPIRES_IN` | ❌ | `24h` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | `7d` | Refresh token expiry |
| `PORT` | ❌ | `5000` | Backend port |
| `CORS_ORIGINS` | ❌ | `http://localhost:3000` | Allowed CORS origins |
| `HMAC_SECRET` | ✅ | — | HMAC signing secret |
| `RATE_LIMIT_MAX` | ❌ | `100` | General rate limit per minute |
| `AUTH_RATE_LIMIT_MAX` | ❌ | `10` | Auth rate limit per minute |

---

## 💡 Tips

- **Generate secrets**: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **First registered user** automatically becomes **ADMIN**
- Backend auto-runs `prisma db push` on startup — no manual migrations needed
- Use Render's **Internal Database URL** for backend (not external) to avoid latency
