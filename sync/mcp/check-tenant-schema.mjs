/**
 * Check tenant table schema
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

async function checkTenantSchema() {
  // Check both local and remote databases
  const databases = [
    {
      name: 'Local (Sync)',
      config: {
        host: process.env.POSTGRES_SYNC_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
        database: process.env.POSTGRES_SYNC_DB || 'postgres',
        user: process.env.POSTGRES_SYNC_USER || 'postgres',
        password: process.env.POSTGRES_SYNC_PASSWORD || '',
      }
    },
    {
      name: 'Remote (Client)',
      config: {
        host: process.env.POSTGRES_CLIENT_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_CLIENT_PORT || '5432', 10),
        database: process.env.POSTGRES_CLIENT_DB || 'postgres',
        user: process.env.POSTGRES_CLIENT_USER || 'postgres',
        password: process.env.POSTGRES_CLIENT_PASSWORD || '',
      }
    }
  ];

  for (const db of databases) {
    const pool = new Pool(db.config);

    try {
      console.log(`\n=== ${db.name} Database ===`);
      console.log('Checking tenant table schema...\n');
      
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'tenant'
        ORDER BY ordinal_position
      `);
      
      if (result.rows.length === 0) {
        console.log('❌ tenant table does not exist');
      } else {
        console.log('✅ tenant table columns:');
        result.rows.forEach(row => {
          console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      await pool.end();
    }
  }
}

checkTenantSchema();
