#!/usr/bin/env node
/**
 * Test Contact Update Operation
 * 
 * This script tests the complete contact update flow:
 * 1. Connect to database
 * 2. Generate a JWT token for a test user
 * 3. Create a test contact via POST /api/contacts
 * 4. Update the contact via PUT /api/contacts/:id with modified data
 * 5. Verify the update succeeds without "column contact.id does not exist" errors
 * 6. Verify the updated data is persisted correctly
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('./src/config/database');
const User = require('./src/models/UserWithSchema');
const Contact = require('./src/models/ContactWithSchema');
const http = require('http');

const DIVIDER = '█'.repeat(120);

async function makeRequest(method, path, token, body = null) {
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
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function main() {
  let testContactId = null;
  
  try {
    console.log('\n' + DIVIDER);
    console.log('█ CONTACT UPDATE OPERATION TEST');
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

    console.log('✅ Token generated\n');

    // Step 4: Wait for backend to be ready
    console.log('Step 4: Waiting for backend to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Backend ready\n');

    // Step 5: Create a test contact
    console.log('Step 5: Creating a test contact via POST /api/contacts...');
    const createContactData = {
      name: 'Test Contact Update',
      email: 'test-update@example.com',
      phone: '555-1234',
      company: 'Test Company',
      role: 'Vendor',
      active: true
    };

    console.log('  - Request body:', JSON.stringify(createContactData, null, 2));

    const createResponse = await makeRequest('POST', '/api/contacts', token, createContactData);
    
    console.log('  - Status:', createResponse.status);
    
    if (createResponse.status !== 201) {
      console.log('✗ Failed to create contact');
      console.log('  - Response:', JSON.stringify(createResponse.body, null, 2));
      process.exit(1);
    }

    console.log('  - Full response data:', JSON.stringify(createResponse.body.data, null, 2));
    testContactId = createResponse.body.data.id;
    console.log('✅ Contact created successfully');
    console.log('  - Contact ID:', testContactId);
    console.log('  - Name:', createResponse.body.data.name);
    console.log('  - Email:', createResponse.body.data.email);
    console.log();

    // Step 6: Update the contact
    console.log('Step 6: Updating the contact via PUT /api/contacts/:id...');
    const updateContactData = {
      name: 'Updated Test Contact',
      email: 'updated-test@example.com',
      phone: '555-5678',
      company: 'Updated Company',
      role: 'Customer',
      active: false
    };

    console.log('  - Contact ID:', testContactId);
    console.log('  - Request body:', JSON.stringify(updateContactData, null, 2));

    const updateResponse = await makeRequest(
      'PUT',
      `/api/contacts/${testContactId}`,
      token,
      updateContactData
    );
    
    console.log('  - Status:', updateResponse.status);
    
    if (updateResponse.status !== 200) {
      console.log('✗ Failed to update contact');
      console.log('  - Response:', JSON.stringify(updateResponse.body, null, 2));
      
      // Check if it's the "column contact.id does not exist" error
      if (updateResponse.body.message && updateResponse.body.message.includes('column contact.id does not exist')) {
        console.log('\n' + DIVIDER);
        console.log('█ ✗ PRIMARY KEY ERROR DETECTED');
        console.log('█ The Contact model is using the wrong primary key column name');
        console.log(DIVIDER + '\n');
      }
      
      process.exit(1);
    }

    console.log('✅ Contact updated successfully');
    console.log('  - Name:', updateResponse.body.data.name);
    console.log('  - Email:', updateResponse.body.data.email);
    console.log('  - Phone:', updateResponse.body.data.phone);
    console.log('  - Company:', updateResponse.body.data.company);
    console.log('  - Role:', updateResponse.body.data.role);
    console.log('  - Active:', updateResponse.body.data.active);
    console.log();

    // Step 7: Verify the updated data
    console.log('Step 7: Verifying the updated data is persisted correctly...');
    
    // Fetch the contact directly from the database
    const verifyContact = await Contact.findById(testContactId);
    
    if (!verifyContact) {
      console.log('✗ Contact not found in database');
      process.exit(1);
    }

    console.log('✅ Contact retrieved from database');
    console.log('  - Name:', verifyContact.name);
    console.log('  - Email:', verifyContact.email);
    console.log('  - Phone:', verifyContact.phone);
    console.log('  - Company:', verifyContact.company);
    console.log('  - Role:', verifyContact.role);
    console.log('  - Active:', verifyContact.active);
    console.log();

    // Verify all fields match
    let allFieldsMatch = true;
    const fieldsToCheck = ['name', 'email', 'phone', 'company', 'role', 'active'];
    
    for (const field of fieldsToCheck) {
      const expectedValue = updateContactData[field];
      const actualValue = verifyContact[field];
      
      if (expectedValue !== actualValue) {
        console.log(`✗ Field mismatch for '${field}':`);
        console.log(`  - Expected: ${expectedValue}`);
        console.log(`  - Actual: ${actualValue}`);
        allFieldsMatch = false;
      }
    }

    if (!allFieldsMatch) {
      console.log('\n' + DIVIDER);
      console.log('█ ✗ CONTACT UPDATE OPERATION TEST FAILED - DATA MISMATCH');
      console.log(DIVIDER + '\n');
      process.exit(1);
    }

    console.log('✅ All fields match expected values');
    console.log();

    // Step 8: Test multi-record update independence
    console.log('Step 8: Testing multi-record update independence...');
    
    // Create a second contact
    const createContact2Data = {
      name: 'Second Test Contact',
      email: 'second-test@example.com',
      phone: '555-9999',
      company: 'Second Company',
      role: 'Contractor',
      active: true
    };

    const createResponse2 = await makeRequest('POST', '/api/contacts', token, createContact2Data);
    
    if (createResponse2.status !== 201) {
      console.log('✗ Failed to create second contact');
      process.exit(1);
    }

    const testContactId2 = createResponse2.body.data.id;
    console.log('✅ Second contact created');
    console.log('  - Contact ID:', testContactId2);
    console.log();

    // Update the second contact
    const updateContact2Data = {
      name: 'Updated Second Contact',
      email: 'updated-second@example.com',
      active: false
    };

    const updateResponse2 = await makeRequest(
      'PUT',
      `/api/contacts/${testContactId2}`,
      token,
      updateContact2Data
    );
    
    if (updateResponse2.status !== 200) {
      console.log('✗ Failed to update second contact');
      process.exit(1);
    }

    console.log('✅ Second contact updated');
    console.log();

    // Verify first contact was not affected
    console.log('Step 9: Verifying first contact was not affected by second update...');
    const verifyContact1Again = await Contact.findById(testContactId);
    
    if (verifyContact1Again.name !== updateContactData.name) {
      console.log('✗ First contact was affected by second update');
      console.log('  - Expected name:', updateContactData.name);
      console.log('  - Actual name:', verifyContact1Again.name);
      process.exit(1);
    }

    console.log('✅ First contact remains unchanged');
    console.log('  - Name:', verifyContact1Again.name);
    console.log();

    // Success!
    console.log(DIVIDER);
    console.log('█ ✅ CONTACT UPDATE OPERATION TEST PASSED');
    console.log('█');
    console.log('█ All tests passed:');
    console.log('█ ✓ Contact created successfully');
    console.log('█ ✓ Contact updated without "column contact.id does not exist" error');
    console.log('█ ✓ Updated data persisted correctly');
    console.log('█ ✓ Multi-record updates are independent');
    console.log(DIVIDER + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n' + DIVIDER);
    console.error('█ ✗ CONTACT UPDATE OPERATION TEST FAILED');
    console.error(DIVIDER);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error(DIVIDER + '\n');
    process.exit(1);
  }
}

main();
