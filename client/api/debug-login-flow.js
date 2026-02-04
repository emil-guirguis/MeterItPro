/**
 * Debug Login Flow Script
 * 
 * This script traces the entire login flow to understand:
 * 1. How tenant_id is stored in the database
 * 2. How tenant_id is loaded from the User model
 * 3. How tenant_id is embedded in the JWT token
 * 4. How tenant_id is extracted from the token in middleware
 * 
 * Usage: node debug-login-flow.js <email> <password>
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./src/models/UserWithSchema');
const db = require('./src/config/database');

const DIVIDER = '█'.repeat(120);

async function debugLoginFlow() {
  try {
    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'password';

    console.log('\n' + DIVIDER);
    console.log('█ DEBUG LOGIN FLOW');
    console.log(DIVIDER);
    console.log(`Testing with email: ${email}`);
    console.log(DIVIDER + '\n');

    // ============================================================
    // STEP 1: Check database directly
    // ============================================================
    console.log('\n' + DIVIDER);
    console.log('█ STEP 1: Check Database Directly');
    console.log(DIVIDER);

    const dbResult = await db.query(
      `SELECT users_id, email, name, role, tenant_id, active, passwordhash 
       FROM users WHERE email = $1`,
      [email]
    );

    if (dbResult.rows.length === 0) {
      console.log('✗ User not found in database');
      process.exit(1);
    }

    const dbUser = dbResult.rows[0];
    console.log('✓ User found in database');
    console.log('Database user object:');
    console.log(JSON.stringify(dbUser, null, 2));
    console.log('\nKey values:');
    console.log(`  - id: ${dbUser.id} (type: ${typeof dbUser.id})`);
    console.log(`  - email: ${dbUser.email}`);
    console.log(`  - tenant_id: ${dbUser.tenant_id} (type: ${typeof dbUser.tenant_id})`);
    console.log(`  - active: ${dbUser.active}`);
    console.log(`  - passwordhash exists: ${!!dbUser.passwordhash}`);

    // ============================================================
    // STEP 2: Load user via User model
    // ============================================================
    console.log('\n' + DIVIDER);
    console.log('█ STEP 2: Load User via User Model');
    console.log(DIVIDER);

    const user = await User.findByEmail(email);

    if (!user) {
      console.log('✗ User model returned null');
      process.exit(1);
    }

    console.log('✓ User loaded via model');
    console.log('User model object keys:', Object.keys(user));
    console.log('\nUser model values:');
    console.log(`  - id: ${user.id} (type: ${typeof user.id})`);
    console.log(`  - email: ${user.email}`);
    console.log(`  - name: ${user.name}`);
    console.log(`  - role: ${user.role}`);
    console.log(`  - tenant_id: ${user.tenant_id} (type: ${typeof user.tenant_id})`);
    console.log(`  - active: ${user.active}`);
    console.log(`  - passwordHash: ${user.passwordHash ? '***HASH***' : 'MISSING'}`);

    // ============================================================
    // STEP 3: Verify password
    // ============================================================
    console.log('\n' + DIVIDER);
    console.log('█ STEP 3: Verify Password');
    console.log(DIVIDER);

    const isPasswordValid = await user.comparePassword(password);
    console.log(`Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log('✗ Password does not match');
      process.exit(1);
    }

    // ============================================================
    // STEP 4: Generate token
    // ============================================================
    console.log('\n' + DIVIDER);
    console.log('█ STEP 4: Generate Token');
    console.log(DIVIDER);

    console.log('Token generation inputs:');
    console.log(`  - userId: ${user.id} (type: ${typeof user.users_id})`);
    console.log(`  - tenant_id: ${user.tenant_id} (type: ${typeof user.tenant_id})`);

    const token = jwt.sign(
      { userId: user.users_id, tenant_id: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✓ Token generated');
    console.log(`Token: ${token.substring(0, 50)}...`);

    // ============================================================
    // STEP 5: Decode token to verify payload
    // ============================================================
    console.log('\n' + DIVIDER);
    console.log('█ STEP 5: Decode Token to Verify Payload');
    console.log(DIVIDER);

    const decoded = jwt.decode(token);
    console.log('Decoded token payload:');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('\nKey values in token:');
    console.log(`  - userId: ${decoded.userId} (type: ${typeof decoded.userId})`);
    console.log(`  - tenant_id: ${decoded.tenant_id} (type: ${typeof decoded.tenant_id})`);
    console.log(`  - iat: ${decoded.iat}`);
    console.log(`  - exp: ${decoded.exp}`);

    // ============================================================
    // STEP 6: Verify token and extract payload
    // ============================================================
    console.log('\n' + DIVIDER);
    console.log('█ STEP 6: Verify Token and Extract Payload');
    console.log(DIVIDER);

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Verified token payload:');
    console.log(JSON.stringify(verified, null, 2));
    console.log('\nKey values in verified token:');
    console.log(`  - userId: ${verified.userId} (type: ${typeof verified.userId})`);
    console.log(`  - tenant_id: ${verified.tenant_id} (type: ${typeof verified.tenant_id})`);

    // ============================================================
    // STEP 7: Simulate middleware - load user from token
    // ============================================================
    console.log('\n' + DIVIDER);
    console.log('█ STEP 7: Simulate Middleware - Load User from Token');
    console.log(DIVIDER);

    console.log('Middleware would:');
    console.log(`  1. Extract userId from token: ${verified.userId}`);
    console.log(`  2. Extract tenant_id from token: ${verified.tenant_id}`);
    console.log(`  3. Call User.findById(${verified.userId})`);

    const middlewareUser = await User.findById(verified.userId);

    if (!middlewareUser) {
      console.log('✗ Middleware: User not found');
      process.exit(1);
    }

    console.log('✓ Middleware: User loaded');
    console.log('Middleware user object:');
    console.log(`  - id: ${middlewareUser.id}`);
    console.log(`  - email: ${middlewareUser.email}`);
    console.log(`  - tenant_id: ${middlewareUser.tenant_id} (type: ${typeof middlewareUser.tenant_id})`);

    // ============================================================
    // STEP 8: Check if tenant_id is being overwritten
    // ============================================================
    console.log('\n' + DIVIDER);
    console.log('█ STEP 8: Check Tenant ID Assignment in Middleware');
    console.log(DIVIDER);

    console.log('Middleware logic:');
    console.log(`  - middlewareUser.tenant_id before assignment: ${middlewareUser.tenant_id}`);
    console.log(`  - verified.tenant_id from token: ${verified.tenant_id}`);

    if (middlewareUser && verified.tenant_id) {
      middlewareUser.tenant_id = verified.tenant_id;
      console.log(`  - middlewareUser.tenant_id after assignment: ${middlewareUser.tenant_id}`);
    }

    console.log('\nFinal user object for request:');
    console.log(`  - id: ${middlewareUser.id}`);
    console.log(`  - email: ${middlewareUser.email}`);
    console.log(`  - tenant_id: ${middlewareUser.tenant_id}`);
    console.log(`  - role: ${middlewareUser.role}`);

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + DIVIDER);
    console.log('█ SUMMARY');
    console.log(DIVIDER);

    const issues = [];

    if (dbUser.tenant_id === null || dbUser.tenant_id === undefined) {
      issues.push('❌ Database: tenant_id is NULL or undefined');
    } else {
      console.log(`✓ Database: tenant_id = ${dbUser.tenant_id}`);
    }

    if (user.tenant_id === null || user.tenant_id === undefined) {
      issues.push('❌ User Model: tenant_id is NULL or undefined');
    } else {
      console.log(`✓ User Model: tenant_id = ${user.tenant_id}`);
    }

    if (decoded.tenant_id === null || decoded.tenant_id === undefined) {
      issues.push('❌ JWT Token: tenant_id is NULL or undefined');
    } else {
      console.log(`✓ JWT Token: tenant_id = ${decoded.tenant_id}`);
    }

    if (middlewareUser.tenant_id === null || middlewareUser.tenant_id === undefined) {
      issues.push('❌ Middleware: tenant_id is NULL or undefined');
    } else {
      console.log(`✓ Middleware: tenant_id = ${middlewareUser.tenant_id}`);
    }

    if (issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      issues.forEach(issue => console.log(`  ${issue}`));
    } else {
      console.log('\n✓ All checks passed - tenant_id flows correctly through the system');
    }

    console.log(DIVIDER + '\n');

  } catch (error) {
    console.error('Error during debug:', error);
    process.exit(1);
  }
}

debugLoginFlow();
