/**
 * Verify Reporting Module Tables
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./src/config/database');

async function verifyTables() {
  try {
    await db.connect();
    
    console.log('\n📋 Checking for reporting module tables...\n');
    
    // Check if tables exist
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('reports', 'report_history', 'report_email_logs')
      ORDER BY table_name
    `);
    
    console.log('Tables found:', result.rows.map(r => r.table_name));
    
    if (result.rows.length === 3) {
      console.log('\n✅ All three reporting tables exist!');
      
      // Check report_email_logs columns
      const colResult = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'report_email_logs'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 report_email_logs columns:');
      colResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
      
      // Check indexes
      const indexResult = await db.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename IN ('reports', 'report_history', 'report_email_logs')
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
      `);
      
      console.log('\n📋 Indexes created:');
      indexResult.rows.forEach(row => {
        console.log(`  - ${row.indexname}`);
      });
    } else {
      console.log('\n⚠️  Not all tables exist. Found:', result.rows.length, 'of 3');
    }
    
    await db.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyTables();
