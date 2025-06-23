// run-tests.mjs
import fetch from 'node-fetch'; // run 'npm install node-fetch' if you don't have it

const BASE_URL = 'http://localhost:3000';
const tests = [];
let failures = 0;

// Helper for colored logs
const log = {
  pass: (msg) => console.log('\x1b[32m✓ %s\x1b[0m', msg),
  fail: (msg) => {
    console.error('\x1b[31m✗ %s\x1b[0m', msg);
    failures++;
  },
  info: (msg) => console.log('\x1b[34mℹ %s\x1b[0m', msg),
};

async function runTest(name, testFn) {
  tests.push({ name, testFn });
}

// --- Define Tests ---

runTest('API Health Check (/api/test-api)', async () => {
  const res = await fetch(`${BASE_URL}/api/test-api`);
  if (!res.ok) throw new Error(`Status: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error('API reported failure');
});

runTest('Public Novels List (/api/public/novels)', async () => {
  const res = await fetch(`${BASE_URL}/api/public/novels`);
  if (!res.ok) throw new Error(`Status: ${res.status}`);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error('Invalid response structure');
});

runTest('Admin Dashboard Page (requires login)', async () => {
  log.info('This test checks if the admin page redirects (3xx) when not logged in.');
  const res = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
  if (res.status < 300 || res.status >= 400) {
    throw new Error(`Expected redirect (3xx status), but got ${res.status}`);
  }
});

runTest('Homepage (/)', async () => {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error(`Status: ${res.status}`);
});

runTest('All Novels Page (/novels)', async () => {
  const res = await fetch(`${BASE_URL}/novels`);
  if (!res.ok) throw new Error(`Status: ${res.status}`);
});


// --- Run All Tests ---

(async () => {
  log.info(`Starting ${tests.length} tests...\n`);
  for (const { name, testFn } of tests) {
    try {
      await testFn();
      log.pass(name);
    } catch (error) {
      log.fail(`${name} - ${error.message}`);
    }
  }
  console.log('\n--------------------');
  if (failures === 0) {
    log.pass('All tests passed!');
  } else {
    log.fail(`${failures} test(s) failed.`);
    process.exit(1); // Exit with error code if tests fail
  }
})();
