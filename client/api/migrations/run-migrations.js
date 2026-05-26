/**
 * Database Migration Runner for Cloudflare Worker
 * Executes SQL migration files in order against Supabase
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.uueumbslimaecposqsdf:ZfyUDh!_x4bSYXm@aws-1-us-west-1.pooler.supabase.com:6543/postgres'
  });

  try {
    console.log('🔄 Starting database migrations...');
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Get all migration files
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    console.log(`📁 Found ${files.length} migration file(s)`);

    // Execute each migration
    for (const file of files) {
      console.log(`\n📄 Running migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query(sql);
        console.log(`✅ Migration completed: ${file}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${file}`);
        console.error(`Error: ${error.message}`);
        throw error;
      }
    }

    console.log('\n✅ All migrations completed successfully');
  } catch (error) {
    console.error('\n❌ Migration process failed:', error.message);
    process.exit(1);
  } finally {
    console.log('🔄 Disconnecting from database...');
    await client.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
