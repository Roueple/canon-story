// test-runner.mjs
import { execSync } from 'child_process';

console.log('🧪 Running Canonstory Tests\n');

// Check if server is running
try {
  const response = await fetch('http://localhost:3000');
  console.log('✅ Dev server is running\n');
} catch (error) {
  console.log('❌ Dev server is not running!');
  console.log('Please run: npm run dev\n');
  process.exit(1);
}

// Run tests
const commands = [
  { name: 'Simple Tests', cmd: 'npx playwright test simple.spec.ts --project=tests' },
  { name: 'Auth Setup', cmd: 'npx playwright test auth.setup.ts' },
];

for (const { name, cmd } of commands) {
  console.log(`Running: ${name}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${name} passed!\n`);
  } catch (error) {
    console.log(`❌ ${name} failed!\n`);
  }
}
