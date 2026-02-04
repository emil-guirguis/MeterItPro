const db = require('./src/config/database');

(async () => {
  try {
    await db.connect();
    const result = await db.query(
      'SELECT users_id, email, tenant_id FROM users WHERE email = $1',
      ['admin@example.com']
    );
    console.log('Current user:', JSON.stringify(result.rows[0], null, 2));
    await db.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
