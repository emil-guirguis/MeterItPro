const User = require('./src/models/UserWithSchema');
const db = require('./src/config/database');

async function debugUser() {
  try {
    await db.connect();
    const user = await User.findByEmail('admin@example.com');
    console.log('User object:', JSON.stringify(user, null, 2));
    console.log('\nuser.status:', user.status);
    console.log('typeof user.status:', typeof user.status);
    console.log('user.status === true:', user.status === true);
    console.log('user.status === false:', user.status === false);
    console.log('!user.status:', !user.status);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugUser();
