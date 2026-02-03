// /**
//  * Test script to verify dashboard API endpoint
//  * 
//  * Usage: node test-dashboard-api.js
//  */

// const axios = require('axios');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '.env') });

// const API_BASE_URL = 'http://localhost:3001/api';

// async function testDashboardAPI() {
//   try {
//     console.log('\n' + '='.repeat(80));
//     console.log('DASHBOARD API TEST');
//     console.log('='.repeat(80) + '\n');

//     // Step 1: Get a valid auth token
//     console.log('Step 1: Getting auth token...');
//     const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
//       email: 'admin@example.com',
//       password: 'admin123'
//     });

//     if (!loginResponse.data.success) {
//       console.error('❌ Login failed:', loginResponse.data.message);
//       process.exit(1);
//     }

//     const token = loginResponse.data.data.token;
//     const user = loginResponse.data.data.user;
//     console.log('✅ Login successful');
//     console.log('   User ID:', user.users_id);
//     console.log('   Tenant ID:', user.tenant_id);
//     console.log('   Role:', user.role);
//     console.log('   Permissions:', user.permissions?.slice(0, 5), '...');

//     // Step 2: Call dashboard API
//     console.log('\nStep 2: Calling /api/dashboard/cards...');
//     const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard/cards`, {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       },
//       params: {
//         page: 1,
//         limit: 25
//       }
//     });

//     if (!dashboardResponse.data.success) {
//       console.error('❌ Dashboard API failed:', dashboardResponse.data.message);
//       process.exit(1);
//     }

//     const dashboardData = dashboardResponse.data.data;
//     console.log('✅ Dashboard API successful');
//     console.log('   Total cards:', dashboardData.total);
//     console.log('   Items returned:', dashboardData.items.length);
//     console.log('   Page:', dashboardData.page);
//     console.log('   Total pages:', dashboardData.totalPages);

//     // Step 3: Display cards
//     if (dashboardData.items.length > 0) {
//       console.log('\nStep 3: Dashboard cards:');
//       dashboardData.items.forEach((card, index) => {
//         console.log(`\n   Card ${index + 1}:`);
//         console.log(`     ID: ${card.dashboard_id}`);
//         console.log(`     Name: ${card.card_name}`);
//         console.log(`     Tenant ID: ${card.tenant_id}`);
//         console.log(`     Meter ID: ${card.meter_id}`);
//         console.log(`     Visualization: ${card.visualization_type}`);
//         console.log(`     Created: ${card.created_at}`);
//       });
//     } else {
//       console.log('\n❌ No dashboard cards returned!');
//     }

//     console.log('\n' + '='.repeat(80));
//     console.log('TEST COMPLETE');
//     console.log('='.repeat(80) + '\n');

//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       console.error('❌ API Error:', error.response?.status, error.response?.data?.message);
//       console.error('   Response:', JSON.stringify(error.response?.data, null, 2));
//     } else {
//       console.error('❌ Error:', error instanceof Error ? error.message : error);
//     }
//     process.exit(1);
//   }
// }

// testDashboardAPI();
