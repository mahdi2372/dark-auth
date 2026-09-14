# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within DARK-AUTH, please send an email to the maintainer. All security vulnerabilities will be promptly addressed.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### What to include

When reporting a vulnerability, please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix or mitigation**: Depends on severity, typically within 2 weeks for critical issues

## Security Best Practices for Deployment

### Environment Variables

Always use strong, unique values for:

- `JWT_SECRET` — At least 64 random characters
- `HMAC_SECRET` — At least 64 random characters
- `DATABASE_URL` — Use strong database credentials

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (via reverse proxy like Nginx)
- [ ] Set `CORS_ORIGINS` to your actual domain
- [ ] Configure rate limiting appropriately
- [ ] Regularly update dependencies (`npm audit`)
- [ ] Use a dedicated PostgreSQL instance (not SQLite)
- [ ] Enable database SSL connections
- [ ] Rotate JWT and HMAC secrets periodically
- [ ] Review audit logs regularly

### Network Security

- Never expose the database directly to the internet
- Use internal network communication between services
- Implement proper firewall rules
- Consider using a VPN for administrative access

### Authentication Security

- Admin passwords should be strong and unique
- Enable 2FA when available
- Regularly review user accounts and permissions
- Monitor failed login attempts

## Known Security Features

DARK-AUTH includes the following built-in security features:

- **bcrypt** password hashing (cost factor 12)
- **JWT** token-based authentication with refresh tokens
- **Rate limiting** on all endpoints (configurable)
- **HMAC** signature verification for client API calls
- **Helmet** HTTP security headers
- **CORS** configuration with configurable origins
- **Audit logging** for all sensitive operations
- **HWID binding** for license enforcement
- **Blacklist engine** for blocking abusers
