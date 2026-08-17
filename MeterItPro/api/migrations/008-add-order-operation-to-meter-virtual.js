/**
 * Database Migration: Add order_by and operation columns to meter_virtual
 *
 * - order_by: integer used to preserve row order in the combined meters list
 *   (already referenced in the GET query but was never created)
 * - operation: char(1) — '+' to add, '-' to subtract the meter from the total.
 *   The first row is always '+'; subsequent rows default to '+' and can be changed.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');

async function runMigration() {
  let wasAlreadyConnected = false;

  try {
    console.log('🔄 Starting migration: add order_by and operation to meter_virtual...');

    wasAlreadyConnected = db.isConnected;
    if (!wasAlreadyConnected) {
      console.log('🔄 Connecting to database...');
      await db.connect();
    } else {
      console.log('✅ Using existing database connection');
    }

    const statements = [
      `ALTER TABLE public.meter_virtual
         ADD COLUMN IF NOT EXISTS order_by integer NOT NULL DEFAULT 0`,

      `ALTER TABLE public.meter_virtual
         ADD COLUMN IF NOT EXISTS operation char(1) NOT NULL DEFAULT '+'`,

      // Back-fill any existing rows so they are ordered sequentially within each virtual meter.
      // This is a best-effort update; the exact order cannot be recovered for pre-existing rows.
      `UPDATE public.meter_virtual mv
       SET order_by = sub.rn
       FROM (
         SELECT meter_virtual_id,
                ROW_NUMBER() OVER (PARTITION BY meter_id ORDER BY meter_virtual_id) - 1 AS rn
         FROM public.meter_virtual
       ) sub
       WHERE mv.meter_virtual_id = sub.meter_virtual_id`,
    ];

    for (let i = 0; i < statements.length; i++) {
      try {
        console.log(`\n📄 Executing statement ${i + 1}/${statements.length}...`);
        await db.query(statements[i]);
        console.log(`✅ Statement ${i + 1} completed`);
      } catch (error) {
        console.error(`❌ Statement ${i + 1} failed: ${error.message}`);
        throw error;
      }
    }

    console.log('\n✅ Migration 008 completed successfully\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (!wasAlreadyConnected && db.isConnected) {
      await db.disconnect();
    }
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
