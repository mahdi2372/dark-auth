const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

async function main() {
  console.log('Seeding database...');

  const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@darkauth.local' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@darkauth.local',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Admin user: ${admin.username}`);

  const app = await prisma.application.upsert({
    where: { appId: 'app_starter_001' },
    update: {},
    create: {
      userId: admin.id,
      name: 'Starter Application',
      description: 'A starter application for getting started with DARK-AUTH',
      appId: 'app_starter_001',
      appSecret: `secret_${uuidv4().replace(/-/g, '')}`,
    },
  });
  console.log(`Application: ${app.name} (ID: ${app.appId})`);

  const licenseKeys = Array.from({ length: 3 }, () => generateKey());
  for (const key of licenseKeys) {
    await prisma.license.upsert({
      where: { key },
      update: {},
      create: {
        appId: app.id,
        key,
        licenseType: 'TIME_LIMITED',
        status: 'UNUSED',
        maxUses: 1,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`${licenseKeys.length} license keys created`);

  await prisma.clientVersion.upsert({
    where: { appId_version: { appId: app.id, version: '1.0.0' } },
    update: {},
    create: {
      appId: app.id,
      version: '1.0.0',
      releaseNotes: 'Initial release',
      isLatest: true,
    },
  });
  console.log('Version 1.0.0 created');

  await prisma.cloudVariable.upsert({
    where: { appId_name: { appId: app.id, name: 'MOTD' } },
    update: {},
    create: {
      appId: app.id,
      name: 'MOTD',
      value: 'Welcome to DARK-AUTH!',
      isSecret: false,
    },
  });
  console.log('Cloud variable MOTD created');

  await prisma.chatMessage.create({
    data: {
      appId: app.id,
      channel: 'general',
      sender: 'System',
      message: 'Server initialized. Client v1.0.0 is live!',
    },
  });
  console.log('Chat announcement created');

  console.log('\nSeed complete!');
  if (process.env.ADMIN_PASSWORD) {
    console.log(`Admin password: ${process.env.ADMIN_PASSWORD}`);
  } else {
    console.log(`Generated admin password: ${adminPassword}`);
    console.log('Save this password! It will not be shown again.');
  }
  console.log(`License keys: ${licenseKeys.join(', ')}`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
