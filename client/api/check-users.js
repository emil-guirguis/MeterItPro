const db = require('./src/config/database');

async function checkUsers() {
  try {
    await db.connect();
    
    // First check what columns exist
    const columns = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Available columns in users table:');
    console.log(columns.rows.map(r => r.column_name).join(', '));
    console.log('');
    
    // Then query users with active status
    const result = await db.query('SELECT users_id, email, active, passwordhash IS NOT NULL as has_password FROM users LIMIT 5');
    console.log('Users in database:');
    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
