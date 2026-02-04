// /**
//  * Test script for meter reading upload endpoint
//  * 
//  * Tests the POST /api/sync/readings/batch endpoint
//  */

// const axios = require('axios');

// const API_URL = 'http://localhost:3001/api';
// const API_KEY = process.env.CLIENT_API_KEY || 'test-api-key';

// async function testUploadEndpoint() {
//   try {
//     console.log('\n🧪 Testing meter reading upload endpoint...\n');

//     // Test data: 3 readings
//     const testReadings = [
//       {
//         meter_id: 1,
//         timestamp: new Date().toISOString(),
//         data_point: 'voltage',
//         value: 230.5,
//         unit: 'V'
//       },
//       {
//         meter_id: 1,
//         timestamp: new Date().toISOString(),
//         data_point: 'current',
//         value: 15.2,
//         unit: 'A'
//       },
//       {
//         meter_id: 2,
//         timestamp: new Date().toISOString(),
//         data_point: 'power',
//         value: 3500.0,
//         unit: 'W'
//       }
//     ];

//     console.log('📤 Sending batch upload request...');
//     console.log(`   Endpoint: POST ${API_URL}/sync/readings/batch`);
//     console.log(`   API Key: ${API_KEY.substring(0, 8)}...`);
//     console.log(`   Readings: ${testReadings.length}`);
//     console.log(`   Data:`, JSON.stringify(testReadings, null, 2));

//     const response = await axios.post(
//       `${API_URL}/sync/readings/batch`,
//       { readings: testReadings },
//       {
//         headers: {
//           'X-API-Key': API_KEY,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     console.log('\n✅ Upload successful!');
//     console.log('Response:', JSON.stringify(response.data, null, 2));

//     if (response.data.success) {
//       console.log(`\n📊 Results:`);
//       console.log(`   Inserted: ${response.data.inserted}`);
//       console.log(`   Skipped: ${response.data.skipped}`);
//       if (response.data.errors && response.data.errors.length > 0) {
//         console.log(`   Errors: ${response.data.errors.length}`);
//         response.data.errors.forEach((err, idx) => {
//           console.log(`     [${idx}] Meter ${err.meter_id}: ${err.error}`);
//         });
//       }
//     }

//   } catch (error) {
//     console.error('\n❌ Upload failed!');
//     if (error.response) {
//       console.error(`Status: ${error.response.status}`);
//       console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
//     } else {
//       console.error(`Error: ${error.message}`);
//     }
//     process.exit(1);
//   }
// }

// // Run test
// testUploadEndpoint().then(() => {
//   console.log('\n✅ Test completed\n');
//   process.exit(0);
// });
