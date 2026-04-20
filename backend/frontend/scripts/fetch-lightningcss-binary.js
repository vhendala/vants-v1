/**
 * Attempt to ensure lightningcss native binary exists in node_modules.
 * This script is intentionally tolerant: it will not fail the install if
 * it cannot download or rebuild the binary, but it tries a few strategies
 * that commonly fix CI environments like Vercel.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(...args) { console.log('[fetch-lightningcss-binary]', ...args); }

try {
  const modPath = path.resolve(process.cwd(), 'node_modules', 'lightningcss');

  if (!fs.existsSync(modPath)) {
    log('lightningcss not installed; skipping binary fetch');
    process.exit(0);
  }

  // Try npm rebuild with update-binary
  log('running: npm rebuild lightningcss --update-binary');
  const res = spawnSync('npm', ['rebuild', 'lightningcss', '--update-binary'], { stdio: 'inherit' });
  if (res.status === 0) {
    log('npm rebuild succeeded');
    process.exit(0);
  }

  // Fallback: try node-gyp rebuild
  log('npm rebuild failed; trying node-gyp rebuild');
  const res2 = spawnSync('npx', ['node-gyp', 'rebuild'], { cwd: modPath, stdio: 'inherit' });
  if (res2.status === 0) {
    log('node-gyp rebuild succeeded');
    process.exit(0);
  }

  log('could not rebuild lightningcss binary; continuing without native binary');
} catch (e) {
  console.error('[fetch-lightningcss-binary] error', e);
}

process.exit(0);
