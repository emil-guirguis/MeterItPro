#!/usr/bin/env node
/**
 * Test Authentication Flow
 * 
 * This script tests the complete authentication flow:
 * 1. Connect to database
 * 2. Find a test user
 * 3. Generate a JWT token
 * 4. Test token verification
 * 5. Simulate the auth middleware flow
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('./src/config/database');
const User = require('./src/models/UserWithSchema');

const DIVIDER = '█'.repeat(120);

async function main() {
  try {
    console.log('\n' + DIVIDER);
    console.log('█ AUTHENTICATION FLOW TEST');
    console.log(DIVIDER + '\n');

    // Step 1: Connect to database
    console.log('Step 1: Connecting to database...');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ NOT SET');
    console.log('JWT_SECRET value:', process.env.JWT_SECRET);
    
    await db.connect();
    console.log('✅ Database connected\n');

    // Step 2: Find a test user
    console.log('Step 2: Finding a test user...');
    const user = await User.findOne({ email: 'admin@example.com' });
    
    if (!user) {
      console.log('✗ No user found with email admin@example.com');
      console.log('Available users:');
      const allUsers = await User.findAll({ limit: 5 });
      console.log(JSON.stringify(allUsers.rows, null, 2));
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log('  - ID:', user.users_id || user.id);
    console.log('  - Email:', user.email);
    console.log('  - Name:', user.name);
    console.log('  - Role:', user.role);
    console.log('  - Tenant ID:', user.tenant_id);
    console.log('  - Active:', user.active);
    console.log('  - Keys:', Object.keys(user).slice(0, 10).join(', '));
    console.log();

    // Step 3: Generate JWT token
    console.log('Step 3: Generating JWT token...');
    const userId = user.users_id || user.id;
    const tenantId = user.tenant_id;
    
    if (!userId) {
      console.log('✗ User ID is missing');
      process.exit(1);
    }

    if (!tenantId) {
      console.log('✗ Tenant ID is missing');
      process.exit(1);
    }

    const token = jwt.sign(
      { userId, tenant_id: tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Token generated:');
    console.log('  - Length:', token.length);
    console.log('  - First 50 chars:', token.substring(0, 50) + '...');
    console.log();

    // Step 4: Verify token
    console.log('Step 4: Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified:');
    console.log('  - userId:', decoded.userId);
    console.log('  - tenant_id:', decoded.tenant_id);
    console.log();

    // Step 5: Simulate auth middleware flow
    console.log('Step 5: Simulating auth middleware flow...');
    console.log('  - Extracting token from Authorization header...');
    const authHeader = `Bearer ${token}`;
    const extractedToken = authHeader.split(' ')[1];
    console.log('  ✓ Token extracted');

    console.log('  - Verifying extracted token...');
    const decodedFromHeader = jwt.verify(extractedToken, process.env.JWT_SECRET);
    console.log('  ✓ Token verified from header');

    console.log('  - Looking up user by ID...');
    const userFromDb = await User.findById(decodedFromHeader.userId);
    
    if (!userFromDb) {
      console.log('  ✗ User not found in database');
      process.exit(1);
    }

    console.log('  ✓ User found in database');
    console.log('    - Email:', userFromDb.email);
    console.log('    - Tenant ID:', userFromDb.tenant_id);
    console.log('    - Active:', userFromDb.active);
    console.log();

    // Step 6: Check tenant context
    console.log('Step 6: Checking tenant context...');
    global.currentTenantId = userFromDb.tenant_id;
    console.log('  - Global tenant context set to:', global.currentTenantId);
    console.log('  ✓ Tenant context ready');
    console.log();

    console.log(DIVIDER);
    console.log('█ ✅ AUTHENTICATION FLOW TEST PASSED');
    console.log(DIVIDER + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n' + DIVIDER);
    console.error('█ ✗ AUTHENTICATION FLOW TEST FAILED');
    console.error(DIVIDER);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error(DIVIDER + '\n');
    process.exit(1);
  }
}

main();
