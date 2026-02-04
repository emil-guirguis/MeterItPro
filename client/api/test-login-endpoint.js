// async function testLoginEndpoint() {
//   try {
//     console.log('Testing login endpoint...');
    
//     const response = await fetch('http://localhost:3001/api/auth/login', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         email: 'admin@example.com',
//         password: 'admin123'
//       })
//     });
    
//     const data = await response.json();
    
//     if (response.ok) {
//       console.log('✅ Login successful!');
//       console.log('Status:', response.status);
//       console.log('Response data:', JSON.stringify(data, null, 2));
//     } else {
//       console.log('❌ Login failed');
//       console.log('Status:', response.status);
//       console.log('Response data:', JSON.stringify(data, null, 2));
//     }
    
//   } catch (error) {
//     console.log('❌ Request error:', error.message);
//     console.log('Is the backend server running on port 3001?');
//   }
// }

// testLoginEndpoint();
