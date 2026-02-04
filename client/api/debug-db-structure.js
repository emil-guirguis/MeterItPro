const db = require('./src/config/database');

async function debugDatabase() {
  try {
    console.log('Connecting to database...');
    await db.connect();
    
    // Check the actual table structure
    console.log('\n=== CHECKING TABLE STRUCTURE ===');
    const tableInfo = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table columns:');
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check actual user data with raw SQL
    console.log('\n=== RAW USER DATA ===');
    const users = await db.query('SELECT id, email, name, passwordhash, role, tenant_id, active FROM users LIMIT 3');
    
    console.log('Raw user data:');
    users.rows.forEach((user, idx) => {
      console.log(`User ${idx + 1}:`);
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Name:', user.name);
      console.log('  Role:', user.role);
      console.log('  Tenant ID:', user.tenant_id);
      console.log('  Active:', user.active);
      console.log('  Password Hash:', user.passwordhash ? `${user.passwordhash.substring(0, 20)}...` : 'NULL/EMPTY');
      console.log('  Password Hash Length:', user.passwordhash?.length || 0);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.disconnect();
    process.exit(0);
  }
}

debugDatabase();