'use strict';

const { execSync } = require('child_process');

const services = ['MeterItSyncFrontend', 'MeterItSyncMCP', 'MeterItSyncAPI'];

console.log('\nStopping MeterIt Pro sync services...\n');

for (const name of services) {
  try {
    execSync(`net stop "${name}"`, { stdio: 'pipe' });
    console.log(`  [OK] Stopped: ${name}`);
  } catch (err) {
    const msg = err.stderr?.toString().trim() || err.message;
    console.log(`  [--] ${name}: ${msg}`);
  }
}

console.log('\nDone.\n');
