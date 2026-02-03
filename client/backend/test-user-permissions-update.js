// /**
//  * Test script to verify user permissions update fix
//  * Tests that permissions can be updated without type validation errors
//  */

// const axios = require('axios');

// const API_BASE_URL = 'http://localhost:3001/api';

// // Test data
// const testUser = {
//   name: 'Test User',
//   email: 'test-permissions@example.com',
//   password: 'TestPassword123!',
//   role: 'manager',
//   active: true
// };

// const updatedPermissions = {
//   user: { create: true, read: true, update: true, delete: false },
//   meter: { create: true, read: true, update: true, delete: true },
//   device: { create: false, read: true, update: false, delete: false },
//   location: { create: false, read: true, update: false, delete: false },
//   contact: { create: false, read: true, update: false, delete: false },
//   template: { create: false, read: true, update: false, delete: false },
//   settings: { read: true, update: false }
// };

// async function runTests() {
//   try {
//     console.log('\n' + '='.repeat(80));
//     console.log('USER PERMISSIONS UPDATE TEST');
//     console.log('='.repeat(80) + '\n');

//     // Step 1: Login to get auth token
//     console.log('Step 1: Logging in...');
//     const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
//       email: 'admin@example.com',
//       password: 'admin123'
//     });
//     const token = loginResponse.data.data.token;
//     console.log('✓ Login successful');

//     // Step 2: Create a test user
//     console.log('\nStep 2: Creating test user...');
//     const createResponse = await axios.post(`${API_BASE_URL}/users`, testUser, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     const userId = createResponse.data.data.id;
//     console.log(`✓ User created with ID: ${userId}`);
//     console.log(`  Initial permissions:`, createResponse.data.data.permissions);

//     // Step 3: Update user with new permissions (nested object format)
//     console.log('\nStep 3: Updating user with nested object permissions...');
//     const updateResponse = await axios.put(
//       `${API_BASE_URL}/users/${userId}`,
//       {
//         name: testUser.name,
//         permissions: updatedPermissions
//       },
//       {
//         headers: { Authorization: `Bearer ${token}` }
//       }
//     );
//     console.log('✓ User updated successfully');
//     console.log(`  Updated permissions:`, updateResponse.data.data.permissions);

//     // Step 4: Verify permissions were stored correctly
//     console.log('\nStep 4: Retrieving user to verify permissions...');
//     const getResponse = await axios.get(`${API_BASE_URL}/users/${userId}`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     console.log('✓ User retrieved successfully');
//     console.log(`  Stored permissions:`, getResponse.data.data.permissions);

//     // Step 5: Update with flat array format
//     console.log('\nStep 5: Updating user with flat array permissions...');
//     const flatArrayPermissions = [
//       'user:create', 'user:read', 'user:update',
//       'meter:create', 'meter:read', 'meter:update', 'meter:delete',
//       'device:read',
//       'location:read',
//       'contact:read',
//       'template:read',
//       'settings:read'
//     ];
//     const updateResponse2 = await axios.put(
//       `${API_BASE_URL}/users/${userId}`,
//       {
//         name: testUser.name,
//         permissions: flatArrayPermissions
//       },
//       {
//         headers: { Authorization: `Bearer ${token}` }
//       }
//     );
//     console.log('✓ User updated with flat array permissions');
//     console.log(`  Updated permissions:`, updateResponse2.data.data.permissions);

//     // Step 6: Clean up - delete test user
//     console.log('\nStep 6: Cleaning up - deleting test user...');
//     await axios.delete(`${API_BASE_URL}/users/${userId}`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     console.log('✓ Test user deleted');

//     console.log('\n' + '='.repeat(80));
//     console.log('ALL TESTS PASSED ✓');
//     console.log('='.repeat(80) + '\n');

//   } catch (error) {
//     console.error('\n' + '='.repeat(80));
//     console.error('TEST FAILED ✗');
//     console.error('='.repeat(80));
//     if (error.response) {
//       console.error('Status:', error.response.status);
//       console.error('Error:', error.response.data);
//     } else {
//       console.error('Error:', error.message);
//     }
//     console.error('='.repeat(80) + '\n');
//     process.exit(1);
//   }
// }

// runTests();
