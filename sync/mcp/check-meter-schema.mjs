/**
 * Check meter table schema in both databases
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../.env.production'), override: true });

async function checkSchema() {
  console.log('=== Checking Meter Table Schema ===\n');

  // Check local database
  console.log('LOCAL DATABASE (Sync):');
  const localPool = new Pool({
    host: process.env.POSTGRES_SYNC_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
    database: process.env.POSTGRES_SYNC_DB || 'postgres',
    user: process.env.POSTGRES_SYNC_USER || 'postgres',
    password: process.env.POSTGRES_SYNC_PASSWORD || '',
  });

  try {
    const result = await localPool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'meter'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ meter table does not exist');
    } else {
      console.log('✅ meter table columns:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await localPool.end();
  }

  console.log('\n');

  // Check remote database
  console.log('REMOTE DATABASE (Client):');
  const remotePool = new Pool({
    host: process.env.POSTGRES_CLIENT_HOST,
    port: parseInt(process.env.POSTGRES_CLIENT_PORT || '5432', 10),
    database: process.env.POSTGRES_CLIENT_DB || 'postgres',
    user: process.env.POSTGRES_CLIENT_USER || 'postgres',
    password: process.env.POSTGRES_CLIENT_PASSWORD || '',
  });

  try {
    const result = await remotePool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'meter'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ meter table does not exist');
    } else {
      console.log('✅ meter table columns:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await remotePool.end();
  }
}

checkSchema();
