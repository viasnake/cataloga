import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const runtimeRoot = resolve('.cache/playwright-runtime');
const debDir = join(runtimeRoot, 'debs');
const rootfsDir = join(runtimeRoot, 'rootfs');
const runtimeLibDir = join(rootfsDir, 'usr/lib/x86_64-linux-gnu');
const requiredPackages = [
  'libatk1.0-0t64',
  'libatk-bridge2.0-0t64',
  'libatspi2.0-0t64',
  'libxcomposite1',
  'libxdamage1',
  'libxfixes3',
  'libxrandr2',
  'libxi6',
  'libxrender1',
  'libgbm1',
  'libasound2t64'
];
const requiredLibraries = [
  'libatk-1.0.so.0',
  'libatk-bridge-2.0.so.0',
  'libatspi.so.0',
  'libXcomposite.so.1',
  'libXdamage.so.1',
  'libXfixes.so.3',
  'libXrandr.so.2',
  'libXi.so.6',
  'libXrender.so.1',
  'libgbm.so.1',
  'libasound.so.2'
];

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const runtimeReady = requiredLibraries.every((library) => existsSync(join(runtimeLibDir, library)));

if (!runtimeReady) {
  mkdirSync(debDir, { recursive: true });
  mkdirSync(rootfsDir, { recursive: true });
  run('apt', ['download', ...requiredPackages], { cwd: debDir });
  run('bash', ['-lc', 'for deb in *.deb; do dpkg-deb -x "$deb" ../rootfs; done'], { cwd: debDir });
}

run('npx', ['playwright', 'install', 'chromium']);

const env = {
  ...process.env,
  LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH
    ? `${runtimeLibDir}:${process.env.LD_LIBRARY_PATH}`
    : runtimeLibDir
};

const result = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env
});

process.exit(result.status ?? 1);
