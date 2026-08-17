/**
 * Database Pool Manager
 * 
 * Manages initialization and lifecycle of PostgreSQL connection pools
 * for both sync (local) and remote (client) databases.
 */

import { Pool } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Public pool for the sync database
 * Use this to execute queries against the local sync database
 */
export let syncPool: Pool;

/**
 * Public pool for the remote database
 * Use this to execute queries against the remote client database
 */
export let remotePool: Pool;

/**
 * Initialize both database pools from environment variables
 */
export function initializePools(): void {
  // Initialize sync database pool
  const syncConfig: DatabaseConfig = {
    host: process.env.POSTGRES_SYNC_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
    database: process.env.POSTGRES_SYNC_DB || 'postgres',
    user: process.env.POSTGRES_SYNC_USER || 'postgres',
    password: process.env.POSTGRES_SYNC_PASSWORD || '',
  };

  syncPool = new Pool({
    host: syncConfig.host,
    port: syncConfig.port,
    database: syncConfig.database,
    user: syncConfig.user,
    password: syncConfig.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  } as any);

  syncPool.on('error', (err) => {
    console.error('Unexpected error on sync database idle client', err);
  });

  console.log('\n📊 [Database Config] Sync Pool initialized:');
  console.log(`   Host: ${syncConfig.host}`);
  console.log(`   Port: ${syncConfig.port}`);
  console.log(`   Database: ${syncConfig.database}`);
  console.log(`   User: ${syncConfig.user}\n`);

  // Initialize remote database pool
  const remoteConfig: DatabaseConfig = {
    host: process.env.POSTGRES_CLIENT_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_CLIENT_PORT || '5432', 10),
    database: process.env.POSTGRES_CLIENT_DB || 'postgres',
    user: process.env.POSTGRES_CLIENT_USER || 'postgres',
    password: process.env.POSTGRES_CLIENT_PASSWORD || '',
  };

  remotePool = new Pool({
    host: remoteConfig.host,
    port: remoteConfig.port,
    database: remoteConfig.database,
    user: remoteConfig.user,
    password: remoteConfig.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  } as any);

  remotePool.on('error', (err) => {
    console.error('Unexpected error on remote database idle client', err);
  });

  console.log('\n📊 [Database Config] Remote Pool initialized:');
  console.log(`   Host: ${remoteConfig.host}`);
  console.log(`   Port: ${remoteConfig.port}`);
  console.log(`   Database: ${remoteConfig.database}`);
  console.log(`   User: ${remoteConfig.user}\n`);
}

/**
 * Close both database pools
 */
export async function closePools(): Promise<void> {
  if (syncPool) {
    await syncPool.end();
    console.log('✅ Sync pool closed');
  }
  if (remotePool) {
    await remotePool.end();
    console.log('✅ Remote pool closed');
  }
}
