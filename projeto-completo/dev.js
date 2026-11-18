import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const serverProc = spawn('node', ['server/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
});

const webProc = spawn(npmCmd, ['--prefix', 'web', 'run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

function shutdown() {
  serverProc.kill();
  webProc.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

serverProc.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`Servidor API encerrou com código ${code}`);
  }
});
