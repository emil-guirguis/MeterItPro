/**
 * Debug script to verify dashboard records in database
 * 
 * Usage: node debug-dashboard.js
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB,
});

async function debugDashboard() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('DASHBOARD DEBUG SCRIPT');
    console.log('='.repeat(80) + '\n');

    // Debug: Check environment variables
    console.log('Environment variables:');
    console.log('  POSTGRES_USER:', process.env.POSTGRES_USER);
    console.log('  POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '***' : 'UNDEFINED');
    console.log('  POSTGRES_HOST:', process.env.POSTGRES_HOST);
    console.log('  POSTGRES_PORT:', process.env.POSTGRES_PORT);
    console.log('  POSTGRES_DB:', process.env.POSTGRES_DB);
    console.log();

    // 1. Check if dashboard table exists
    console.log('1. Checking if dashboard table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'dashboard'
      );
    `);
    console.log('   Dashboard table exists:', tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      console.log('   ❌ Dashboard table does not exist!');
      process.exit(1);
    }

    // 2. Check dashboard table structure
    console.log('\n2. Dashboard table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'dashboard'
      ORDER BY ordinal_position;
    `);
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 3. Count total dashboard records
    console.log('\n3. Total dashboard records:');
    const totalCount = await pool.query('SELECT COUNT(*) as count FROM dashboard;');
    console.log(`   Total records: ${totalCount.rows[0].count}`);

    // 4. Check dashboard records by tenant
    console.log('\n4. Dashboard records by tenant:');
    const byTenant = await pool.query(`
      SELECT tenant_id, COUNT(*) as count
      FROM dashboard
      GROUP BY tenant_id
      ORDER BY tenant_id;
    `);
    if (byTenant.rows.length === 0) {
      console.log('   No dashboard records found!');
    } else {
      byTenant.rows.forEach(row => {
        console.log(`   Tenant ${row.tenant_id}: ${row.count} records`);
      });
    }

    // 5. Show sample dashboard records
    console.log('\n5. Sample dashboard records (first 5):');
    const samples = await pool.query(`
      SELECT 
        dashboard_id,
        tenant_id,
        created_by_users_id,
        card_name,
        meter_id,
        meter_element_id,
        visualization_type,
        grid_x,
        grid_y,
        grid_w,
        grid_h,
        created_at
      FROM dashboard
      ORDER BY dashboard_id DESC
      LIMIT 5;
    `);
    if (samples.rows.length === 0) {
      console.log('   No records to display');
    } else {
      console.table(samples.rows);
    }

    // 6. Check for any NULL tenant_id values
    console.log('\n6. Checking for NULL tenant_id values:');
    const nullTenants = await pool.query(`
      SELECT COUNT(*) as count
      FROM dashboard
      WHERE tenant_id IS NULL;
    `);
    console.log(`   Records with NULL tenant_id: ${nullTenants.rows[0].count}`);

    // 7. Check tenant table
    console.log('\n7. Checking tenant table:');
    const tenantCount = await pool.query('SELECT COUNT(*) as count FROM tenant;');
    console.log(`   Total tenants: ${tenantCount.rows[0].count}`);

    // 8. Check users table
    console.log('\n8. Checking users table:');
    const userCount = await pool.query('SELECT COUNT(*) as count FROM "users";');
    console.log(`   Total users: ${userCount.rows[0].count}`);

    // 9. Show users with their tenant_id
    console.log('\n9. Sample users with tenant_id:');
    const users = await pool.query(`
      SELECT users_id, email, role, tenant_id
      FROM "users"
      ORDER BY users_id DESC
      LIMIT 5;
    `);
    console.table(users.rows);

    // 10. Check if dashboard records reference valid tenants
    console.log('\n10. Validating dashboard records reference valid tenants:');
    const invalidTenants = await pool.query(`
      SELECT COUNT(*) as count
      FROM dashboard d
      WHERE NOT EXISTS (
        SELECT 1 FROM tenant t WHERE t.tenant_id = d.tenant_id
      );
    `);
    console.log(`   Dashboard records with invalid tenant_id: ${invalidTenants.rows[0].count}`);

    console.log('\n' + '='.repeat(80));
    console.log('DEBUG COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Error during debug:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

debugDashboard();
