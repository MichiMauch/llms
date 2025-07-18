require('dotenv').config({ path: './.env.local' });
const { spawn } = require('child_process');

const child = spawn('npx', ['drizzle-kit', 'push'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error(`spawn error: ${error}`);
});

child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`drizzle-kit push exited with code ${code} and signal ${signal}`);
  }
});