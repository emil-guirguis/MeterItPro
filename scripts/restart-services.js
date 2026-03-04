/**
 * Restart all MeterItPro sync Windows services.
 * Must be run from an Administrator terminal.
 * Called by the git post-merge hook after a build.
 *
 * Usage:  npm run services:restart
 */

'use strict';

const { execSync } = require('child_process');

const services = [
  { name: 'MeterItSyncAPI',      label: 'Sync API      (port 3002)' },
  { name: 'MeterItSyncMCP',      label: 'Sync MCP      (BACnet)'    },
  { name: 'MeterItSyncFrontend', label: 'Sync Frontend (port 3003)' },
];

console.log('\nRestarting MeterIt Pro sync services...\n');

for (const svc of services) {
  try {
    execSync(`net stop "${svc.name}"`,  { stdio: 'pipe' });
    execSync(`net start "${svc.name}"`, { stdio: 'pipe' });
    console.log(`  [OK] ${svc.label}`);
  } catch (err) {
    const msg = err.stderr?.toString().trim() || err.message;
    console.error(`  [ERR] ${svc.name}: ${msg}`);
  }
}

console.log('\nDone.\n');
