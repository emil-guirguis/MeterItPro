/**
 * Debug script to trace tenant_id through the login flow
 */
const db = require('./src/config/database');
const User = require('./src/models/UserWithSchema');

async function debugTenantId() {
  try {
    console.log('🔍 [DEBUG] Starting tenant_id debug trace...\n');
    
    // Connect to database first
    console.log('🔌 [CONNECT] Connecting to database...');
    await db.connect();
    console.log('✅ [CONNECT] Connected\n');
    
    // Step 1: Check database directly
    console.log('📊 [STEP 1] Checking database for users...');
    const dbResult = await db.query('SELECT id, email, name, role, tenant_id, active FROM users LIMIT 5');
    console.log('Database rows:', JSON.stringify(dbResult.rows, null, 2));
    
    if (dbResult.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const testEmail = dbResult.rows[0].email;
    console.log(`\n📧 [STEP 2] Testing with user: ${testEmail}`);
    
    // Step 2: Use User.findByEmail
    console.log('🔎 [STEP 2a] Calling User.findByEmail()...');
    const user = await User.findByEmail(testEmail);
    
    if (!user) {
      console.log('❌ User not found via findByEmail');
      return;
    }
    
    console.log('\n✅ [STEP 2b] User found via findByEmail');
    console.log('User object keys:', Object.keys(user));
    console.log('User data:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_id: user.tenant_id,
      active: user.active
    });
    
    // Step 3: Check if tenant_id is accessible
    console.log('\n🔐 [STEP 3] Checking tenant_id accessibility...');
    console.log('user.tenant_id:', user.tenant_id);
    console.log('typeof user.tenant_id:', typeof user.tenant_id);
    console.log('user.tenant_id === null:', user.tenant_id === null);
    console.log('user.tenant_id === undefined:', user.tenant_id === undefined);
    console.log('!!user.tenant_id:', !!user.tenant_id);
    
    // Step 4: Simulate token generation
    console.log('\n🎫 [STEP 4] Simulating token generation...');
    const jwt = require('jsonwebtoken');
    const tokenPayload = { userId: user.id, tenant_id: user.tenant_id };
    console.log('Token payload:', tokenPayload);
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    const decoded = jwt.decode(token);
    console.log('Decoded token:', decoded);
    
    if (decoded.tenant_id) {
      console.log('✅ tenant_id IS in token');
    } else {
      console.log('❌ tenant_id IS NOT in token');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.disconnect();
    process.exit(0);
  }
}

debugTenantId();
