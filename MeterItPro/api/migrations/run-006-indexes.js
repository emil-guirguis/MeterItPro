/**
 * Run migration 006: Add relationship indexes
 * 
 * This script adds database indexes for foreign keys to optimize
 * relationship queries and JOIN operations.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('Starting migration 006: Add relationship indexes...');
    
    // Read the migration SQL file
    const sqlPath = path.join(__dirname, '006_add_relationship_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✓ Migration 006 completed successfully');
    console.log('✓ Added indexes for foreign keys');
    console.log('✓ Added composite indexes for common query patterns');
    
    // Verify indexes were created
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);
    
    console.log(`\n✓ Total indexes created: ${result.rows.length}`);
    console.log('\nIndexes by table:');
    
    const indexesByTable = {};
    result.rows.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });
    
    Object.entries(indexesByTable).forEach(([table, indexes]) => {
      console.log(`  ${table}: ${indexes.length} indexes`);
    });
    
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n✓ Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });
