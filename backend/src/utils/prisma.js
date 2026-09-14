const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// When executing in Vercel serverless lambda, prepare writable SQLite in /tmp
if (process.env.VERCEL) {
  const currentDbUrl = process.env.DATABASE_URL || '';
  if (currentDbUrl.startsWith('file:') || !currentDbUrl.startsWith('postgres')) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      // Look for bundled dev.db
      const potentialPaths = [
        path.join(__dirname, '../../prisma/dev.db'),
        path.join(process.cwd(), 'backend/prisma/dev.db'),
        path.join(process.cwd(), 'prisma/dev.db'),
        path.join(process.cwd(), 'dev.db'),
      ];
      for (const p of potentialPaths) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpDbPath);
            break;
          } catch {}
        }
      }
    }
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  }
}

const prisma = new PrismaClient();

module.exports = prisma;
