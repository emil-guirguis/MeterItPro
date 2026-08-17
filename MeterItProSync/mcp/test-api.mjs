#!/usr/bin/env node

import axios from 'axios';

const API_URL = 'http://localhost:3002';

console.log('\n🧪 Testing Sync MCP API Server\n');

const endpoints = [
  { method: 'GET', path: '/health', name: 'Health Check' },
  { method: 'GET', path: '/api/local/tenant', name: 'Get Tenant' },
  { method: 'GET', path: '/api/local/meters', name: 'Get Meters' },
  { method: 'GET', path: '/api/local/readings', name: 'Get Readings' },
  { method: 'GET', path: '/api/local/sync-status', name: 'Get Sync Status' },
];

for (const endpoint of endpoints) {
  try {
    console.log(`📡 Testing ${endpoint.name}...`);
    const url = `${API_URL}${endpoint.path}`;
    console.log(`   URL: ${url}`);
    
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Data:`, JSON.stringify(response.data, null, 2).substring(0, 200));
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`   ❌ Connection refused - Server not running on port 3002`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`   ❌ Host not found`);
    } else if (error.response) {
      console.log(`   ❌ Status: ${error.response.status}`);
      console.log(`   Error:`, error.response.data);
    } else {
      console.log(`   ❌ Error:`, error.message);
    }
  }
  console.log();
}

console.log('✅ Test complete\n');
