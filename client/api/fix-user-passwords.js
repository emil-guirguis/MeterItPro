const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Load env from backend/.env first, then fall back to project root .env if needed
const backendEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
} else {
  // fallback to root .env
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
}

function getPgPool() {
  // Support DATABASE_URL/POSTGRES_URL if present
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    return new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  }
  const host = process.env.POSTGRES_HOST;
  const port = Number(process.env.POSTGRES_PORT || 5432);
  const database = process.env.POSTGRES_DB || process.env.POSTGRES_DATABASE || 'postgres';
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  if (!host || !user) {
    throw new Error('Missing PostgreSQL environment variables. Ensure POSTGRES_HOST/POSTGRES_USER/POSTGRES_PASSWORD are set.');
  }
  return new Pool({
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false }
  });
}

async function fixUserPasswords() {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    console.log('🔧 Fixing user passwords in PostgreSQL...');

    // Hash the desired passwords
    const [adminHash, managerHash, techHash] = await Promise.all([
      bcrypt.hash('admin123', 12),
      bcrypt.hash('manager123', 12),
      bcrypt.hash('tech123', 12)
    ]);

    // Update statements (note: column is passwordhash in Postgres schema)
    const updates = [
      { email: 'admin@example.com', hash: adminHash },
      { email: 'manager@example.com', hash: managerHash },
      { email: 'tech@example.com', hash: techHash }
    ];

    let updatedCount = 0;
    for (const u of updates) {
      const res = await client.query(
        `UPDATE users SET passwordhash = $1, updatedat = CURRENT_TIMESTAMP WHERE email = $2`,
        [u.hash, u.email]
      );
      updatedCount += res.rowCount || 0;
    }

    console.log(`✅ Passwords updated for ${updatedCount} users`);
    console.log('');
    console.log('Login credentials (new):');
    console.log('- Admin: admin@example.com / admin123');
    console.log('- Manager: manager@example.com / manager123');
    console.log('- Technician: tech@example.com / tech123');
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

fixUserPasswords();