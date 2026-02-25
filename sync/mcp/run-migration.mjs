/**
 * Simple migration runner
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../.env.production'), override: true });

async function runMigration(migrationFile) {
  const pool = new Pool({
    host: process.env.POSTGRES_SYNC_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
    database: process.env.POSTGRES_SYNC_DB || 'postgres',
    user: process.env.POSTGRES_SYNC_USER || 'postgres',
    password: process.env.POSTGRES_SYNC_PASSWORD || '',
  });

  try {
    console.log(`Running migration: ${migrationFile}`);
    
    const sql = readFileSync(join(__dirname, 'migrations', migrationFile), 'utf8');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
const migrationFile = process.argv[2] || '004_add_sync_columns_to_.sql';
runMigration(migrationFile).catch(() => process.exit(1));
