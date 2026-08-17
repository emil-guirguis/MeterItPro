/**
 * Install MeterItPro sync components as Windows services using node-windows.
 * Must be run from an Administrator terminal.
 *
 * Usage:  npm run services:install
 *         — or —
 *         node scripts/install-services.js
 */

'use strict';

const { Service } = require('node-windows');
const { execSync }  = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path          = require('path');

const repoRoot = path.join(__dirname, '..');
const logsDir  = path.join(repoRoot, 'logs');

if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });

// ── Build all three components first ─────────────────────────────────────────
console.log('\nBuilding sync components...');
const builds = ['MeterItProSync/api', 'MeterItProSync/mcp', 'MeterItProSync/frontend'];
builds.forEach((pkg, i) => {
  console.log(`  [${i + 1}/${builds.length}] ${pkg}...`);
  execSync('npm run build', { cwd: path.join(repoRoot, pkg), stdio: 'inherit' });
});
console.log('  All builds succeeded.\n');

// ── Helper: install a service and resolve when started ────────────────────────
function installService(cfg) {
  return new Promise((resolve, reject) => {
    const svc = new Service(cfg);

    svc.on('install', () => {
      console.log(`  [OK] Installed: ${cfg.name}`);
      svc.start();
    });

    svc.on('alreadyinstalled', () => {
      console.log(`  [--] Already installed: ${cfg.name} — restarting`);
      svc.restart();
    });

    svc.on('start', () => {
      console.log(`  [OK] Running:   ${cfg.name}`);
      resolve();
    });

    svc.on('restart', () => {
      console.log(`  [OK] Restarted: ${cfg.name}`);
      resolve();
    });

    svc.on('error', (err) => {
      console.error(`  [ERR] ${cfg.name}:`, err);
      reject(new Error(`Failed to install ${cfg.name}: ${err}`));
    });

    svc.install();
  });
}

// ── Service definitions ───────────────────────────────────────────────────────
const services = [
  {
    name:             'MeterItSyncAPI',
    description:      'MeterIt Pro — Sync REST API (port 3002)',
    script:           path.join(repoRoot, 'MeterItProSync/api/dist/server.js'),
    workingDirectory: path.join(repoRoot, 'MeterItProSync/api'),
    logpath:          logsDir,
  },
  {
    name:             'MeterItSyncMCP',
    description:      'MeterIt Pro — Sync MCP/BACnet service',
    script:           path.join(repoRoot, 'MeterItProSync/mcp/dist/index.js'),
    workingDirectory: path.join(repoRoot, 'MeterItProSync/mcp'),
    logpath:          logsDir,
  },
  {
    name:             'MeterItSyncFrontend',
    description:      'MeterIt Pro — Sync Frontend static server (port 3003)',
    script:           path.join(repoRoot, 'MeterItProSync/frontend/preview-server.mjs'),
    workingDirectory: path.join(repoRoot, 'MeterItProSync/frontend'),
    logpath:          logsDir,
  },
];

// ── Install sequentially then configure git hook ──────────────────────────────
(async () => {
  console.log('Installing Windows services...');

  for (const cfg of services) {
    await installService(cfg);
  }

  // Register .githooks/post-merge as the git hook directory
  execSync('git config core.hooksPath .githooks', { cwd: repoRoot, stdio: 'inherit' });
  console.log('\nGit hook configured (.githooks/post-merge runs on every git pull).');

  console.log('\n=================================================');
  console.log('  Installation complete!');
  console.log('=================================================');
  console.log('  Sync API:      http://localhost:3002');
  console.log('  Sync Frontend: http://localhost:3003');
  console.log('');
  console.log('  Services auto-start with Windows.');
  console.log('  On git pull, components rebuild and restart.');
  console.log('');
  console.log('  Logs:        logs/MeterItSyncAPI.log  etc.');
  console.log('  Restart:     npm run services:restart  (as admin)');
  console.log('  Uninstall:   npm run services:uninstall  (as admin)');
  console.log('=================================================\n');
})().catch(err => {
  console.error('\nInstallation failed:', err.message);
  process.exit(1);
});
