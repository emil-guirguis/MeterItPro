/**
 * Check all users in database and their tenant_ids
 */
const db = require('./src/config/database');

async function checkAllUsers() {
  try {
    console.log('🔍 Checking all users in database...\n');
    
    await db.connect();
    
    const result = await db.query('SELECT users_id, email, name, role, tenant_id, active FROM users ORDER BY users_id');
    
    console.log('📊 Users in database:');
    console.log('='.repeat(100));
    result.rows.forEach((user, idx) => {
      console.log(`${idx + 1}. ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
      console.log(`   Role: ${user.role}, Tenant ID: ${user.tenant_id}, Active: ${user.active}`);
      console.log('');
    });
    
    console.log('='.repeat(100));
    console.log(`\nTotal users: ${result.rows.length}`);
    
    // Check for users with null tenant_id
    const nullTenantUsers = result.rows.filter(u => u.tenant_id === null);
    if (nullTenantUsers.length > 0) {
      console.log(`\n⚠️  WARNING: ${nullTenantUsers.length} user(s) have NULL tenant_id:`);
      nullTenantUsers.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.disconnect();
    process.exit(0);
  }
}

checkAllUsers();
