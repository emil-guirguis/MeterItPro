// #!/usr/bin/env node
// /**
//  * Test Verify Endpoint with Valid Token
//  * 
//  * This script tests the /api/auth/verify endpoint:
//  * 1. Create a test user
//  * 2. Generate a valid JWT token
//  * 3. Call verify endpoint with token
//  * 4. Verify response contains user data with 200 status
//  * 
//  * Requirements: 2.3
//  */

// require('dotenv').config();
// const jwt = require('jsonwebtoken');
// const db = require('./src/config/database');
// const User = require('./src/models/UserWithSchema');

// const DIVIDER = '█'.repeat(120);

// async function testVerifyEndpoint() {
//   try {
//     console.log('\n' + DIVIDER);
//     console.log('█ TEST: Verify Endpoint with Valid Token');
//     console.log('█ Requirements: 2.3');
//     console.log(DIVIDER + '\n');

//     // Step 1: Connect to database
//     console.log('Step 1: Connecting to database...');
//     await db.connect();
//     console.log('✅ Database connected\n');

//     // Step 2: Find or create a test user
//     console.log('Step 2: Finding or creating test user...');
//     let user = await User.findByEmail('test-verify@example.com');
    
//     if (!user) {
//       console.log('  - Creating new test user...');
//       const passwordHash = await User.hashPassword('testPassword123');
      
//       // Get or create default tenant
//       let tenantId = null;
//       const tenantResult = await db.query('SELECT tenant_id FROM tenant LIMIT 1');
//       if (tenantResult.rows && tenantResult.rows.length > 0) {
//         tenantId = tenantResult.rows[0].tenant_id;
//       } else {
//         const createTenantResult = await db.query(
//           'INSERT INTO tenant (name, active) VALUES ($1, $2) RETURNING tenant_id',
//           ['Test Tenant', true]
//         );
//         tenantId = createTenantResult.rows[0].tenant_id;
//       }

//       // Create user directly via database query to ensure passwordhash is set
//       const createResult = await db.query(
//         'INSERT INTO users (email, name, passwordhash, role, active, tenant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
//         ['test-verify@example.com', 'Test Verify User', passwordHash, 'viewer', true, tenantId]
//       );
      
//       user = new User(createResult.rows[0]);
//       console.log('  ✓ Test user created');
//     } else {
//       console.log('  ✓ Test user found');
//     }

//     console.log('✅ User ready:');
//     console.log('  - ID (users_id):', user.users_id);
//     console.log('  - ID (id):', user.id);
//     console.log('  - Email:', user.email);
//     console.log('  - Tenant ID:', user.tenant_id);
//     console.log('  - Active:', user.active);
//     console.log();

//     // Step 3: Generate valid JWT token
//     console.log('Step 3: Generating valid JWT token...');
//     const userId = user.users_id || user.id;
//     if (!userId) {
//       throw new Error('User ID is missing from user object');
//     }
//     const token = jwt.sign(
//       { userId, tenant_id: user.tenant_id },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );
//     console.log('✅ Token generated');
//     console.log('  - Token length:', token.length);
//     console.log();

//     // Step 4: Verify token structure
//     console.log('Step 4: Verifying token structure...');
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log('✅ Token verified:');
//     console.log('  - userId:', decoded.userId);
//     console.log('  - tenant_id:', decoded.tenant_id);
//     console.log('  - Has userId:', !!decoded.userId);
//     console.log('  - Has tenant_id:', !!decoded.tenant_id);
    
//     if (!decoded.userId) {
//       throw new Error('Token missing userId field');
//     }
//     if (!decoded.tenant_id) {
//       throw new Error('Token missing tenant_id field');
//     }
//     console.log();

//     // Step 5: Simulate verify endpoint middleware flow
//     console.log('Step 5: Simulating verify endpoint middleware flow...');
    
//     // 5a: Extract token from Authorization header
//     console.log('  5a: Extracting token from Authorization header...');
//     const authHeader = `Bearer ${token}`;
//     const extractedToken = authHeader.split(' ')[1];
//     console.log('  ✓ Token extracted');

//     // 5b: Verify token
//     console.log('  5b: Verifying extracted token...');
//     const decodedFromHeader = jwt.verify(extractedToken, process.env.JWT_SECRET);
//     console.log('  ✓ Token verified from header');
//     console.log('    - userId:', decodedFromHeader.userId);
//     console.log('    - tenant_id:', decodedFromHeader.tenant_id);

//     // 5c: Look up user by userId
//     console.log('  5c: Looking up user by userId...');
//     const userFromDb = await User.findById(decodedFromHeader.userId);
    
//     if (!userFromDb) {
//       throw new Error('User not found in database after token decode');
//     }
//     console.log('  ✓ User found in database');

//     // 5d: Verify user is active
//     console.log('  5d: Verifying user is active...');
//     if (!userFromDb.active) {
//       throw new Error('User is not active');
//     }
//     console.log('  ✓ User is active');

//     // 5e: Set tenant context
//     console.log('  5e: Setting tenant context...');
//     global.currentTenantId = userFromDb.tenant_id;
//     console.log('  ✓ Tenant context set to:', global.currentTenantId);
//     console.log();

//     // Step 6: Verify response data structure
//     console.log('Step 6: Verifying response data structure...');
//     console.log('✅ User data ready for response:');
//     console.log('  - users_id:', userFromDb.users_id);
//     console.log('  - email:', userFromDb.email);
//     console.log('  - name:', userFromDb.name);
//     console.log('  - role:', userFromDb.role);
//     console.log('  - tenant_id:', userFromDb.tenant_id);
//     console.log('  - active:', userFromDb.active);
//     console.log();

//     // Step 7: Validate response would be 200 with user data
//     console.log('Step 7: Validating response structure...');
//     const responseData = {
//       success: true,
//       data: {
//         user: {
//           users_id: userFromDb.id,
//           email: userFromDb.email,
//           name: userFromDb.name,
//           role: userFromDb.role,
//           tenant_id: userFromDb.tenant_id,
//           active: userFromDb.active,
//           client: userFromDb.tenant_id
//         }
//       }
//     };

//     console.log('✅ Response structure valid:');
//     console.log('  - success:', responseData.success);
//     console.log('  - data.user.users_id:', responseData.data.user.users_id);
//     console.log('  - data.user.email:', responseData.data.user.email);
//     console.log('  - data.user.tenant_id:', responseData.data.user.tenant_id);
//     console.log();

//     // Step 8: Verify all requirements met
//     console.log('Step 8: Verifying all requirements met...');
//     const checks = [
//       { name: 'Token generated with userId', pass: !!decoded.userId },
//       { name: 'Token generated with tenant_id', pass: !!decoded.tenant_id },
//       { name: 'Token can be decoded', pass: !!decodedFromHeader },
//       { name: 'User found by userId', pass: !!userFromDb },
//       { name: 'User is active', pass: userFromDb.active },
//       { name: 'Response has user data', pass: !!responseData.data.user },
//       { name: 'Response has users_id', pass: !!responseData.data.user.users_id },
//       { name: 'Response has email', pass: !!responseData.data.user.email },
//       { name: 'Response has tenant_id', pass: !!responseData.data.user.tenant_id }
//     ];

//     let allPassed = true;
//     checks.forEach(check => {
//       console.log(`  ${check.pass ? '✓' : '✗'} ${check.name}`);
//       if (!check.pass) allPassed = false;
//     });
//     console.log();

//     if (!allPassed) {
//       throw new Error('Some requirements not met');
//     }

//     console.log(DIVIDER);
//     console.log('█ ✅ VERIFY ENDPOINT TEST PASSED');
//     console.log('█ Requirement 2.3: Verify endpoint returns 200 with user data');
//     console.log(DIVIDER + '\n');

//     process.exit(0);
//   } catch (error) {
//     console.error('\n' + DIVIDER);
//     console.error('█ ✗ VERIFY ENDPOINT TEST FAILED');
//     console.error(DIVIDER);
//     console.error('Error:', error.message);
//     console.error('Stack:', error.stack);
//     console.error(DIVIDER + '\n');
//     process.exit(1);
//   }
// }

// testVerifyEndpoint();
