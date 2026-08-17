#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../.env.production'), override: true });

const config = {
  host: process.env.POSTGRES_SYNC_HOST || process.env.POSTGRES_CLIENT_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_SYNC_PORT || process.env.POSTGRES_CLIENT_PORT || '5432', 10),
  database: process.env.POSTGRES_SYNC_DB || process.env.POSTGRES_CLIENT_DB || 'postgres',
  user: process.env.POSTGRES_SYNC_USER || process.env.POSTGRES_CLIENT_USER || 'postgres',
  password: process.env.POSTGRES_SYNC_PASSWORD || process.env.POSTGRES_CLIENT_PASSWORD || '',
};

console.log('\n📊 Database Configuration:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   Database: ${config.database}`);
console.log(`   User: ${config.user}\n`);

const pool = new Pool(config);

try {
  console.log('🔗 Connecting to database...');
  const client = await pool.connect();
  console.log('✅ Connected!\n');

  // Check if tenant table exists
  console.log('📋 Checking if tenant table exists...');
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'tenant'
    )
  `);
  const tableExists = tableCheck.rows[0].exists;
  console.log(`   Table exists: ${tableExists}\n`);

  if (tableExists) {
    // Get tenant data
    console.log('🔍 Querying tenant data...');
    const result = await client.query('SELECT * FROM tenant LIMIT 1');
    console.log(`   Found ${result.rows.length} row(s)\n`);
    
    if (result.rows.length > 0) {
      console.log('📊 Tenant data:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('⚠️  No tenant data found in database');
    }
  } else {
    console.log('❌ Tenant table does not exist!');
    console.log('   You need to create the tenant table first.');
  }

  client.release();
  await pool.end();
  console.log('\n✅ Done');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
