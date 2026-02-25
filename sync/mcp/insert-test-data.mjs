/**
 * Insert test data for upload sync testing
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

async function insertTestData() {
  const pool = new Pool({
    host: process.env.POSTGRES_SYNC_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
    database: process.env.POSTGRES_SYNC_DB || 'postgres',
    user: process.env.POSTGRES_SYNC_USER || 'postgres',
    password: process.env.POSTGRES_SYNC_PASSWORD || '',
  });

  try {
    console.log('Inserting test data...\n');
    
    // Check for existing meters
    const meterResult = await pool.query('SELECT meter_id, name FROM meter LIMIT 5');
    
    if (meterResult.rows.length === 0) {
      console.log('No meters found. Creating a test meter...');
      
      // Insert a test meter
      const insertMeter = await pool.query(`
        INSERT INTO meter (name, type, status, active, created_at, updated_at)
        VALUES ('Test Meter for Sync', 'electric', 'active', true, NOW(), NOW())
        RETURNING id, name
      `);
      
      console.log(`Created meter: ${insertMeter.rows[0].name} (ID: ${insertMeter.rows[0].meter_id})`);
      meterResult.rows.push(insertMeter.rows[0]);
    } else {
      console.log(`Found ${meterResult.rows.length} existing meters`);
      meterResult.rows.forEach(m => console.log(`  - ${m.name} (ID: ${m.meter_id})`));
    }
    
    const meterId = meterResult.rows[0].meter_id;
    
    // Get a valid tenant_id
    const tenantResult = await pool.query('SELECT tenant_id FROM tenant LIMIT 1');
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenants found in database. Cannot insert meter readings.');
      return;
    }
    
    const tenantId = tenantResult.rows[0].tenant_id;
    console.log(`Using tenant: ${tenantId}`);
    
    // Insert test meter readings
    console.log(`\nInserting test meter readings for meter ID ${meterId}...`);
    
    const result = await pool.query(`
      INSERT INTO meter_reading (
        id, meter_id, createdat, energy, power, voltage, current, 
        frequency, tenant_id, is_synchronized
      )
      VALUES 
        (gen_random_uuid(), $1, NOW() - INTERVAL '3 hours', 100.5, 50.2, 230.0, 10.5, 50.0, $2, false),
        (gen_random_uuid(), $1, NOW() - INTERVAL '2 hours', 150.3, 60.8, 231.0, 12.2, 50.1, $2, false),
        (gen_random_uuid(), $1, NOW() - INTERVAL '1 hour', 200.7, 75.1, 229.5, 15.8, 49.9, $2, false),
        (gen_random_uuid(), $1, NOW() - INTERVAL '30 minutes', 250.2, 85.3, 230.5, 18.2, 50.0, $2, false),
        (gen_random_uuid(), $1, NOW() - INTERVAL '15 minutes', 300.8, 95.7, 231.2, 20.5, 50.1, $2, false)
      RETURNING id
    `, [meterId, tenantId]);
    
    console.log(`✅ Inserted ${result.rowCount} test meter readings`);
    
    // Check queue size
    const queueResult = await pool.query(
      'SELECT COUNT(*) as count FROM meter_reading WHERE is_synchronized = false'
    );
    console.log(`\nCurrent queue size: ${queueResult.rows[0].count} unsynchronized readings`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

insertTestData().catch(() => process.exit(1));
