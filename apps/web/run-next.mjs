import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const envFile = new URL('../../.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const [command, ...args] = process.argv.slice(2);
const defaults = command === 'build' ? [] : ['--hostname', process.env.HOST || '127.0.0.1'];
const child = spawn(process.execPath, [
  'node_modules/next/dist/bin/next', command, 'apps/web', ...defaults, ...args,
], { cwd: root, stdio: 'inherit', env: process.env });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
