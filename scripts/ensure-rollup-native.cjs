const { existsSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const process = require('node:process');

function getRollupVersion() {
  try {
    return require('rollup/package.json').version;
  } catch {
    return null;
  }
}

function isMusl() {
  if (process.platform !== 'linux') return false;
  try {
    const header = process.report?.getReport?.().header;
    return header ? !header.glibcVersionRuntime : false;
  } catch {
    return false;
  }
}

function getPackageBase() {
  const { platform, arch } = process;

  if (platform === 'linux') {
    if (arch === 'x64') return isMusl() ? 'linux-x64-musl' : 'linux-x64-gnu';
    if (arch === 'arm64') return isMusl() ? 'linux-arm64-musl' : 'linux-arm64-gnu';
    if (arch === 'arm') return isMusl() ? 'linux-arm-musleabihf' : 'linux-arm-gnueabihf';
  }

  if (platform === 'darwin') {
    if (arch === 'arm64') return 'darwin-arm64';
    if (arch === 'x64') return 'darwin-x64';
  }

  if (platform === 'win32') {
    if (arch === 'x64') return 'win32-x64-msvc';
    if (arch === 'arm64') return 'win32-arm64-msvc';
    if (arch === 'ia32') return 'win32-ia32-msvc';
  }

  if (platform === 'freebsd') {
    if (arch === 'x64') return 'freebsd-x64';
    if (arch === 'arm64') return 'freebsd-arm64';
  }

  if (platform === 'openbsd' && arch === 'x64') {
    return 'openbsd-x64';
  }

  return null;
}

function ensureRollupNative() {
  const version = getRollupVersion();
  if (!version) return;

  const base = getPackageBase();
  if (!base) return;

  const packageName = `@rollup/rollup-${base}`;

  try {
    require.resolve(packageName);
    return;
  } catch {}

  const modulePath = path.resolve(process.cwd(), 'node_modules', ...packageName.split('/'));
  if (existsSync(modulePath)) return;

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['install', '--no-save', '--ignore-scripts', `${packageName}@${version}`], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

ensureRollupNative();
