/**
 * Attempt to ensure lightningcss native binary exists in node_modules.
 * This script is tolerant: it will not fail the install if it cannot
 * download or rebuild the binary, but it tries strategies that commonly
 * fix CI environments like Vercel.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(...args) { console.log('[fetch-lightningcss-binary]', ...args); }

try {
  let modPath;
  try {
    const pkgPath = require.resolve('lightningcss/package.json');
    modPath = path.dirname(pkgPath);
  } catch (e) {
    // If require.resolve fails, try finding it in node_modules manually
    const localModPath = path.resolve(process.cwd(), 'node_modules', 'lightningcss');
    const rootModPath = path.resolve(process.cwd(), '..', 'node_modules', 'lightningcss');
    if (fs.existsSync(localModPath)) modPath = localModPath;
    else if (fs.existsSync(rootModPath)) modPath = rootModPath;
    else {
      log('lightningcss not found; skipping binary fetch');
      process.exit(0);
    }
  }

  log('Found lightningcss at:', modPath);

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

  // Final fallback: try to fetch the binary directly from the npm package tarball
  try {
    log('attempting to download binary from npm pack');
    const pack = spawnSync('npm', ['pack', 'lightningcss@latest'], { stdio: 'pipe' });
    if (pack.status === 0) {
      const tarball = pack.stdout.toString().trim().split('\n').pop();
      log('npm pack produced:', tarball);

      const platform = process.platform; // e.g. linux
      const arch = process.arch; // e.g. x64
      const filename = `lightningcss.${platform}-${arch}-gnu.node`;
      let entry = `package/node/${filename}`;
      if (platform === 'linux' && arch === 'arm64') {
        entry = `package/node/lightningcss.linux-arm64-gnu.node`;
      }

      // Ensure destination folder
      const destDir = path.join(modPath, 'node');
      try { fs.mkdirSync(destDir, { recursive: true }); } catch (e) {}

      // Use tar to extract the specific file
      const tarRes = spawnSync('tar', ['-xOf', tarball, entry], { stdio: ['ignore', 'pipe', 'inherit'] });
      if (tarRes.status === 0 && tarRes.stdout && tarRes.stdout.length > 0) {
        const outPath = path.join(destDir, filename);
        fs.writeFileSync(outPath, tarRes.stdout);
        log('extracted binary to', outPath);
        // cleanup tarball
        try { fs.unlinkSync(tarball); } catch (e) {}
        process.exit(0);
      } else {
        log('tar extraction failed, status:', tarRes.status);
        try { fs.unlinkSync(tarball); } catch (e) {}
      }
    } else {
      log('npm pack failed with status', pack.status);
    }
  } catch (e) {
    log('failed to download/extract binary via npm pack:', e && e.message);
  }

  log('could not rebuild or download lightningcss binary; continuing without native binary');
} catch (e) {
  console.error('[fetch-lightningcss-binary] error', e);
}

process.exit(0);
