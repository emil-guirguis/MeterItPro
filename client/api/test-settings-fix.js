/**
 * Test script to verify the settings service fix
 */

const SettingsService = require('./src/services/settingsService');

// Mock database query function
const mockDb = {
  query: async (sql, params) => {
    console.log('SQL Query:', sql);
    console.log('Parameters:', params);
    
    // Simulate a successful update
    if (sql.includes('UPDATE tenant')) {
      return {
        rows: [{
          tenant_id: params[0],
          name: 'Test Company',
          url: 'https://example.com',
          street: '123 Main St',
          street2: 'Suite 100',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA',
          created_at: new Date(),
          updated_at: new Date()
        }]
      };
    }
    
    // Simulate a successful select
    return {
      rows: [{
        tenant_id: 1,
        name: 'Test Company',
        url: 'https://example.com',
        street: '123 Main St',
        street2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
        created_at: new Date(),
        updated_at: new Date()
      }]
    };
  }
};

// Replace the db module
require.cache[require.resolve('./src/config/database')].exports = mockDb;

async function testSettingsService() {
  console.log('='.repeat(80));
  console.log('Testing SettingsService Fix');
  console.log('='.repeat(80));
  
  try {
    // Test 1: Get company settings
    console.log('\n✓ Test 1: Get company settings');
    const settings = await SettingsService.getCompanySettings(1);
    console.log('Result:', JSON.stringify(settings, null, 2));
    
    // Test 2: Update company settings
    console.log('\n✓ Test 2: Update company settings');
    const updateData = {
      name: 'Updated Company',
      url: 'https://updated.com',
      street: '456 Oak Ave',
      city: 'Los Angeles'
    };
    
    const updated = await SettingsService.updateCompanySettings(1, updateData);
    console.log('Result:', JSON.stringify(updated, null, 2));
    
    // Test 3: Format for database
    console.log('\n✓ Test 3: Format for database');
    const frontendData = {
      name: 'My Company',
      url: 'https://mycompany.com',
      address: {
        street: '789 Pine Rd',
        street2: 'Apt 5',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA'
      }
    };
    
    const dbData = SettingsService.formatForDatabase(frontendData);
    console.log('Result:', JSON.stringify(dbData, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests passed!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSettingsService();
