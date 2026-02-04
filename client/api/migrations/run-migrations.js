/**
 * Database Migration Runner
 * Executes SQL migration files in order
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');

async function runMigrations() {
  let wasAlreadyConnected = false;
  
  try {
    console.log('🔄 Starting database migrations...');
    
    // Check if database is already connected (called from server.js)
    wasAlreadyConnected = db.isConnected;
    
    // Only connect if not already connected
    if (!wasAlreadyConnected) {
      console.log('🔄 Connecting to database...');
      await db.connect();
    } else {
      console.log('✅ Using existing database connection');
    }
    
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
        await db.query(sql);
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
    // Only disconnect if we connected in this function
    if (!wasAlreadyConnected && db.isConnected) {
      console.log('🔄 Disconnecting from database...');
      await db.disconnect();
    } else if (wasAlreadyConnected) {
      console.log('✅ Keeping database connection open (called from server.js)');
    }
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
