/**
 * Database Configuration for Sync Backend API
 *
 * Initializes PostgreSQL connection pools for the sync and remote databases.
 */

import { Pool } from 'pg';
// Note: dotenv is loaded by server.ts before this module is imported

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Database pools
export let syncPool: Pool;
export let remotePool: Pool;

/**
 * Initialize both database pools from environment variables
 */
export async function initializePools(): Promise<void> {
  // Initialize sync database pool
  const syncConfig: DatabaseConfig = {
    host: process.env.POSTGRES_SYNC_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
    database: process.env.POSTGRES_SYNC_DB || 'postgres',
    user: process.env.POSTGRES_SYNC_USER || 'postgres',
    password: process.env.POSTGRES_SYNC_PASSWORD || '',
  };

  console.log('\n📊 [Database] Initializing sync database pool:');
  console.log(`   Host: ${syncConfig.host}`);
  console.log(`   Port: ${syncConfig.port}`);
  console.log(`   Database: ${syncConfig.database}`);
  console.log(`   User: ${syncConfig.user}`);

  syncPool = new Pool({
    host: syncConfig.host,
    port: syncConfig.port,
    database: syncConfig.database,
    user: syncConfig.user,
    password: syncConfig.password,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  syncPool.on('error', (err) => {
    console.error('❌ [Database] Unexpected error on sync pool:', err);
  });

  // Initialize remote database pool
  const remoteConfig: DatabaseConfig = {
    host: process.env.POSTGRES_CLIENT_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_CLIENT_PORT || '5432', 10),
    database: process.env.POSTGRES_CLIENT_DB || 'postgres',
    user: process.env.POSTGRES_CLIENT_USER || 'postgres',
    password: process.env.POSTGRES_CLIENT_PASSWORD || '',
  };

  console.log('\n📊 [Database] Initializing remote database pool:');
  console.log(`   Host: ${remoteConfig.host}`);
  console.log(`   Port: ${remoteConfig.port}`);
  console.log(`   Database: ${remoteConfig.database}`);
  console.log(`   User: ${remoteConfig.user}`);

  remotePool = new Pool({
    host: remoteConfig.host,
    port: remoteConfig.port,
    database: remoteConfig.database,
    user: remoteConfig.user,
    password: remoteConfig.password,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  remotePool.on('error', (err) => {
    console.error('❌ [Database] Unexpected error on remote pool:', err);
  });

  // Test connections
  try {
    const syncResult = await syncPool.query('SELECT NOW()');
    console.log('✅ [Database] Sync database connected:', syncResult.rows[0].now);
  } catch (err) {
    console.error('❌ [Database] Failed to connect to sync database:', err);
  }

  try {
    const remoteResult = await remotePool.query('SELECT NOW()');
    console.log('✅ [Database] Remote database connected:', remoteResult.rows[0].now);
  } catch (err) {
    console.warn('⚠️  [Database] Failed to connect to remote database:', err);
    // Don't throw - remote connection is optional for some operations
  }
}

/**
 * Close both database pools
 */
export async function closePools(): Promise<void> {
  if (syncPool) {
    await syncPool.end();
    console.log('✅ [Database] Sync pool closed');
  }
  if (remotePool) {
    await remotePool.end();
    console.log('✅ [Database] Remote pool closed');
  }
}

/**
 * Health check for sync database
 */
export async function healthCheckSync(): Promise<{ status: string; timestamp?: string; error?: string }> {
  try {
    const result = await syncPool.query('SELECT NOW()');
    return { status: 'healthy', timestamp: result.rows[0].now };
  } catch (err) {
    return { status: 'unhealthy', error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Health check for remote database
 */
export async function healthCheckRemote(): Promise<{ status: string; timestamp?: string; error?: string }> {
  try {
    const result = await remotePool.query('SELECT NOW()');
    return { status: 'healthy', timestamp: result.rows[0].now };
  } catch (err) {
    return { status: 'unhealthy', error: err instanceof Error ? err.message : String(err) };
  }
}
