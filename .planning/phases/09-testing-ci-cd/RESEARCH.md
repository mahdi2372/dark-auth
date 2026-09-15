## Validation Architecture

This section applies if Nyquist validation is enabled for Phase 9.

### Nyquist Validation Coverage

The Nyquist principle requires that every critical requirement be verified by an automated test or check. For Phase 9 (Testing & CI/CD), the following validation architecture maps requirements to test/CI coverage:

| Requirement | Validation Method | CI Gate |
|-------------|-------------------|---------|
| R11.1 Jest + Supertest configured | `jest --version` check + test execution | backend-test job |
| R11.2 Vitest configured | `npm run test` in frontend | frontend-test job |
| R11.3 Test DB isolation | SQLite in-memory for unit, PostgreSQL for integration | Both test jobs |
| R11.4 Test config via env | `.env.test` or setup files reading env vars | setup.js + globalSetup.js |
| R12.1 Auth route tests | `auth.test.js` covering register/login/refresh/me | backend-test job |
| R12.2 App CRUD tests | `apps.test.js` covering create/list/get/update/delete | backend-test job |
| R12.3 License tests | `licenses.test.js` covering generate/bulk/verify/ban/unban | backend-test job |
| R12.4 Client API tests | `client.test.js` covering activate/verify/check-update/download | backend-test job |
| R12.5 Feature route tests | `features.test.js` covering cloud vars/blacklist/webhooks/app-users | backend-test job |
| R12.6 Security tests | `auth.test.js` + `rateLimiter.test.js` covering JWT rejection, rate limiting, ownership | backend-test job |
| R13.1 Auth context tests | `AuthContext.test.jsx` covering login/register/token/logout | frontend-test job |
| R13.2 API client tests | `client.test.js` covering axios interceptors and endpoints | frontend-test job |
| R13.3 Component smoke tests | `*.test.jsx` for Login/Dashboard/Apps/Licenses pages | frontend-test job |
| R14.1 GitHub Actions workflow | `.github/workflows/ci.yml` with lint+test+build | N/A (the workflow itself) |
| R14.2 Docker build on main | Docker build job in CI workflow | docker job |
| R14.3 Security audit in CI | npm audit + Trivy steps | security-audit job |
| R14.4 Status badge in README | README.md badge check | Manual verification |

### Validation Commands

```bash
# Backend
cd backend && npm test -- --coverage          # Run all backend tests with coverage
cd backend && npm run lint                    # Lint backend code

# Frontend
cd frontend && npm run test -- --coverage    # Run all frontend tests with coverage
cd frontend && npm run lint                   # Lint frontend code

# CI/CD
# Triggered automatically on push/PR via .github/workflows/ci.yml
```

### Nyquist Gaps

If any requirement lacks automated validation, it should be flagged:
- R14.4 (Status badge): Manual verification required until README is updated
- R12.1-R12.6, R13.1-R13.3: These are test requirements themselves; they are validated by the existence and execution of the corresponding test files
- R11.3 (Test DB isolation): Validated by the test setup using SQLite in-memory and PostgreSQL service container