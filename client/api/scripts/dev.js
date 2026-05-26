#!/usr/bin/env node
// Wrapper that loads .dev.vars into process.env so `wrangler dev` sees
// CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE for local Hyperdrive
// emulation. .dev.vars is gitignored — safe place for the local DB credential.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.dev.vars') });

const { spawn } = require('child_process');
const args = process.argv.slice(2);
const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['wrangler', 'dev', ...args],
  { stdio: 'inherit', shell: true, env: process.env }
);

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('Failed to launch wrangler:', err);
  process.exit(1);
});
