#!/usr/bin/env node

// Non-blocking development script for Sync MCP Server
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Starting Sync MCP Server in development mode...\n');

// Start TypeScript compiler in watch mode
console.log('📦 Starting TypeScript compiler in watch mode...');
const tscWatch = spawn('npx', ['tsc', '--watch'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

let serverProcess = null;

tscWatch.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Found 0 errors')) {
    console.log('✅ TypeScript compilation successful');
    
    // Kill old server if running
    if (serverProcess) {
      console.log('🔄 Restarting server...');
      serverProcess.kill();
    }
    
    // Start MCP server
    setTimeout(() => {
      serverProcess = startServer();
    }, 500);
  } else if (output.includes('error')) {
    console.log('❌ TypeScript compilation error:', output.trim());
  }
});

tscWatch.stderr.on('data', (data) => {
  const output = data.toString();
  if (!output.includes('Watching for file changes')) {
    console.log('⚠️  Compiler:', output.trim());
  }
});

function startServer() {
  console.log('🚀 Starting Sync MCP Server...');
  const server = spawn('node', ['dist/MeterItProSync/mcp/src/index.js'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[Sync MCP]', output.trim());
  });

  server.stderr.on('data', (data) => {
    const output = data.toString();
    console.error('[Sync MCP Error]', output.trim());
  });

  server.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.log(`⚠️  Server exited with code ${code}`);
    }
  });

  return server;
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Sync MCP development environment...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  tscWatch.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Sync MCP development environment...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  tscWatch.kill('SIGTERM');
  process.exit(0);
});

console.log('⌚ Waiting for initial TypeScript compilation...');
console.log('💡 Server will start automatically after compilation\n');
