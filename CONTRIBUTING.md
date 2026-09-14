# Contributing to DARK-AUTH

Thank you for your interest in contributing to DARK-AUTH! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Format](#commit-message-format)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a branch for your feature or fix
4. Make your changes
5. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker (optional, for PostgreSQL)

### Backend

```bash
cd backend
npm install
npx prisma generate
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

- **Email**: `admin@darkauth.local`
- **Username**: `admin`
- **Password**: `admin123`

## Project Structure

```
DARK-AUTH/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── config.js         # Environment configuration
│   │   ├── index.js          # Entry point
│   │   ├── middleware/       # Auth, security, rate limiting
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities (JWT, password, keygen)
│   └── prisma/               # Database schema and seed
├── frontend/         # React + Vite dashboard
│   └── src/
│       ├── api/              # API client
│       ├── components/       # Reusable components
│       ├── context/          # React context (auth)
│       ├── pages/            # Page components
│       └── styles/           # CSS
├── sdk/              # Client SDKs (14 languages)
├── example-client/   # Python example client
└── .github/          # CI/CD and templates
```

## How to Contribute

### Reporting Bugs

1. Check existing [issues](https://github.com/mahdi2372/dark-auth/issues) first
2. Open a new issue using the **Bug Report** template
3. Include steps to reproduce, expected behavior, and environment details

### Suggesting Features

1. Check existing [issues](https://github.com/mahdi2372/dark-auth/issues) first
2. Open a new issue using the **Feature Request** template
3. Describe the problem and your proposed solution

### Submitting Code

1. Pick an issue or create one first
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the coding standards
4. Test your changes locally
5. Commit with a clear message
6. Push and open a pull request

## Pull Request Process

1. Update the README.md if you change APIs or add features
2. Ensure your code follows the project's coding standards
3. Fill out the pull request template completely
4. Link the related issue(s) in your PR description
5. Wait for CI checks to pass
6. Request a review from maintainers

### PR Checklist

- [ ] Code follows the project's coding standards
- [ ] Self-review of code completed
- [ ] Changes are tested locally
- [ ] Documentation updated (if applicable)
- [ ] No hardcoded secrets or credentials
- [ ] No demo/placeholder content added
- [ ] Prisma schema changes include migration plan

## Coding Standards

### General

- Use consistent indentation (2 spaces for JS/JSX)
- Write descriptive variable and function names
- Keep functions focused and small
- Add JSDoc comments for public APIs

### Backend (Node.js/Express)

- Follow Express.js conventions
- Use async/await for asynchronous operations
- Handle errors with proper status codes
- Validate input with proper checks
- Use the shared Prisma singleton from `utils/prisma.js`

### Frontend (React)

- Use functional components with hooks
- Follow React component naming (PascalCase)
- Keep components focused on a single responsibility
- Use CSS variables from the design system

### Security

- Never commit secrets, API keys, or passwords
- Never hardcode credentials
- Use environment variables for configuration
- Follow OWASP security guidelines

## Commit Message Format

Use clear, descriptive commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons)
- `refactor`: Code refactoring without feature changes
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

### Examples

```
feat(licenses): add bulk license export
fix(auth): prevent token reuse after logout
docs(readme): update deployment instructions
refactor(prisma): consolidate client instances
```

## Questions?

Open a [discussion](https://github.com/mahdi2372/dark-auth/discussions) if you have questions about contributing.
