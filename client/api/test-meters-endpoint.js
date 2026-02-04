const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
  try {
    // Create a test token using the same secret as the backend
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const token = jwt.sign({ userId: 1, tenant_id: 1 }, secret, { expiresIn: '1h' });
    
    console.log('Token:', token);
    console.log('Secret:', secret);
    console.log('\nTrying to call /api/meters endpoint...\n');
    
    // Try to call the meters endpoint
    const response = await fetch('http://localhost:3001/api/meters?page=1&limit=25', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      console.log('✅ Response:', data);
    } else {
      console.error('❌ Error:', data);
      if (data.detail) {
        console.error('Detail:', data.detail);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
