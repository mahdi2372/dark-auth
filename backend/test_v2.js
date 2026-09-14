const http = require('http');

async function test() {
  console.log('--- Starting DARK-AUTH v2 API Integration Test ---');

  const app = require('./src/index.js');
  const server = app.listen(5099, '127.0.0.1', async () => {
    try {
      const BASE = 'http://127.0.0.1:5099/api/v2';

      const prisma = require('./src/utils/prisma');
      const appRecord = await prisma.application.findFirst();
      if (!appRecord) throw new Error('No application found in DB. Run seed first.');

      console.log(`[1] Found App: ${appRecord.appId}`);

      console.log('[2] Testing /init...');
      const initRes = await fetch(`${BASE}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: appRecord.appId,
          secret: appRecord.appSecret,
          version: '1.0.0',
        }),
      }).then(r => r.json());

      console.log('Init response:', initRes);
      if (!initRes.success || !initRes.session_token) throw new Error('Init failed');

      const sessionToken = initRes.session_token;

      const license = await prisma.license.findFirst({ where: { appId: appRecord.id } });
      if (!license) throw new Error('No license found. Run seed first.');

      console.log('\n[3] Testing /license...');
      const licRes = await fetch(`${BASE}/license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          key: license.key,
          hwid: 'TEST_AUTOMATED_HWID_12345',
        }),
      }).then(r => r.json());

      console.log('License response:', licRes);
      if (!licRes.success) throw new Error('License activation failed');

      console.log('\n[4] Testing /var/get...');
      const varRes = await fetch(`${BASE}/var/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          name: 'MOTD',
        }),
      }).then(r => r.json());

      console.log('Cloud Variable MOTD:', varRes);
      if (!varRes.success || !varRes.value) throw new Error('Var get failed');

      console.log('\n[5] Testing /chat...');
      const chatRes = await fetch(`${BASE}/chat?session_token=${sessionToken}`).then(r => r.json());
      console.log('Chat messages count:', chatRes.messages?.length);

      console.log('\n[6] Testing /check...');
      const checkRes = await fetch(`${BASE}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      }).then(r => r.json());
      console.log('Session check:', checkRes);

      console.log('\nAll v2 tests passed!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Test failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

test();
