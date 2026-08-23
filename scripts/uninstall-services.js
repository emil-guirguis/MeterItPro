/**
 * Remove MeterItPro sync Windows services.
 * Must be run from an Administrator terminal.
 *
 * Usage:  npm run services:uninstall
 *         — or —
 *         node scripts/uninstall-services.js
 */

'use strict';

const { Service } = require('node-windows');
const path        = require('path');

const repoRoot = path.join(__dirname, '..');

const services = [
  {
    name:   'MeterItSyncAPI',
    script: path.join(repoRoot, 'MeterItProSync/api/dist/server.js'),
  },
  {
    name:   'MeterItSyncMCP',
    script: path.join(repoRoot, 'MeterItProSync/mcp/dist/MeterItProSync/mcp/src/index.js'),
  },
  {
    name:   'MeterItSyncFrontend',
    script: path.join(repoRoot, 'MeterItProSync/frontend/preview-server.mjs'),
  },
];

function uninstallService(cfg) {
  return new Promise((resolve) => {
    const svc = new Service(cfg);

    svc.on('uninstall', () => {
      console.log(`  [OK] Removed: ${cfg.name}`);
      resolve();
    });

    svc.on('alreadyuninstalled', () => {
      console.log(`  [--] Not installed: ${cfg.name} (skipped)`);
      resolve();
    });

    svc.on('error', (err) => {
      console.error(`  [ERR] ${cfg.name}:`, err);
      resolve(); // continue with others
    });

    try {
      svc.uninstall();
    } catch (e) {
      console.error(`  [ERR] ${cfg.name}:`, e.message);
      resolve();
    }
  });
}

(async () => {
  console.log('\nRemoving MeterIt Pro sync services...\n');

  for (const cfg of services) {
    await uninstallService(cfg);
  }

  console.log('\nAll services removed.');
  console.log('Git hook configuration remains.');
  console.log('To also remove: git config --unset core.hooksPath\n');
})().catch(err => {
  console.error('Uninstall failed:', err.message);
  process.exit(1);
});
