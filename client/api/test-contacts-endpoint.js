#!/usr/bin/env node
/**
 * Test Contacts Endpoint
 * 
 * This script tests the complete contacts endpoint flow:
 * 1. Connect to database
 * 2. Generate a JWT token for a test user
 * 3. Make an HTTP request to GET /api/contacts with the token
 * 4. Verify the response
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('./src/config/database');
const User = require('./src/models/UserWithSchema');
const http = require('http');

const DIVIDER = '█'.repeat(120);

async function makeRequest(method, path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('\n' + DIVIDER);
    console.log('█ CONTACTS ENDPOINT TEST');
    console.log(DIVIDER + '\n');

    // Step 1: Connect to database
    console.log('Step 1: Connecting to database...');
    await db.connect();
    console.log('✅ Database connected\n');

    // Step 2: Find a test user
    console.log('Step 2: Finding a test user...');
    const user = await User.findOne({ email: 'admin@example.com' });
    
    if (!user) {
      console.log('✗ No user found with email admin@example.com');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Tenant ID:', user.tenant_id);
    console.log();

    // Step 3: Generate JWT token
    console.log('Step 3: Generating JWT token...');
    const token = jwt.sign(
      { userId: user.id, tenant_id: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Token generated');
    console.log();

    // Step 4: Test the contacts endpoint
    console.log('Step 4: Testing GET /api/contacts endpoint...');
    console.log('  - Waiting for backend to be ready...');
    
    // Wait a bit for the backend to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await makeRequest('GET', '/api/contacts', token);
      
      console.log('✅ Response received:');
      console.log('  - Status:', response.status);
      console.log('  - Content-Type:', response.headers['content-type']);
      
      if (response.status === 200) {
        console.log('  - Success: true');
        console.log('  - Data items:', response.body.data?.items?.length || 0);
        console.log('  - Total:', response.body.data?.total || 0);
        console.log();
        console.log(DIVIDER);
        console.log('█ ✅ CONTACTS ENDPOINT TEST PASSED');
        console.log(DIVIDER + '\n');
      } else if (response.status === 401) {
        console.log('  ✗ Authentication failed');
        console.log('  - Message:', response.body.message);
        console.log('  - Detail:', response.body.detail);
        console.log();
        console.log(DIVIDER);
        console.log('█ ✗ CONTACTS ENDPOINT TEST FAILED - AUTH ERROR');
        console.log(DIVIDER + '\n');
        process.exit(1);
      } else if (response.status === 500) {
        console.log('  ✗ Server error');
        console.log('  - Message:', response.body.message);
        console.log('  - Detail:', response.body.detail);
        console.log();
        console.log(DIVIDER);
        console.log('█ ✗ CONTACTS ENDPOINT TEST FAILED - SERVER ERROR');
        console.log(DIVIDER + '\n');
        process.exit(1);
      } else {
        console.log('  ✗ Unexpected status:', response.status);
        console.log('  - Response:', JSON.stringify(response.body, null, 2));
        console.log();
        console.log(DIVIDER);
        console.log('█ ✗ CONTACTS ENDPOINT TEST FAILED - UNEXPECTED STATUS');
        console.log(DIVIDER + '\n');
        process.exit(1);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('✗ Connection refused - backend is not running');
        console.log('  Please start the backend with: npm start');
        console.log();
        console.log(DIVIDER);
        console.log('█ ✗ CONTACTS ENDPOINT TEST FAILED - BACKEND NOT RUNNING');
        console.log(DIVIDER + '\n');
        process.exit(1);
      }
      throw error;
    }

    process.exit(0);
  } catch (error) {
    console.error('\n' + DIVIDER);
    console.error('█ ✗ CONTACTS ENDPOINT TEST FAILED');
    console.error(DIVIDER);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error(DIVIDER + '\n');
    process.exit(1);
  }
}

main();
