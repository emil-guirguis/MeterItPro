/**
 * PostgreSQL Database Client for Sync
 * 
 * Provides connection management and query methods for the Sync Database.
 * Handles meters, meter_reading, and sync_log tables.
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { TenantEntity, MeterEntity, MeterReadingEntity, SyncLog } from '../entities/index.js';
import { execQuery } from '../helpers/sql-functions.js';

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

// ==================== PUBLIC POOL OBJECTS ====================

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
export async function initializePools() {
    let sync, remote;

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
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  } as any);

  syncPool.on('error', (err) => {
    console.error('Unexpected error on sync database sync lient', err);
    throw err;
  });

  // try {
  //   sync = await syncPool.connect();
  //   console.log('Successfully connected to the local sync database');
  //   sync.release(); // Release client back to the pool
  // } catch (err) {
  //   console.error('Failed to connect to the local sync database', err);
  //   throw err;
  // }

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
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  } as any);

  remotePool.on('error', (err) => {
    console.error('Unexpected error on remote database idle client', err);
    throw err;
  });

  // try {
  //   remote = await remotePool.connect();
  //   console.log('Successfully connected to the remote  database');
  //   remote.release(); 
  // } catch (err) {
  //   console.error('Failed to connect to the remote  database', err);
  // }
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

export class SyncDatabase {
  private pool: Pool;

  constructor(config?: DatabaseConfig) {
    // Always use the global syncPool (initialized by initializePools())
    if (!syncPool) {
      throw new Error('SyncDatabase requires initializePools() to be called first. Global syncPool is not initialized.');
    }
    this.pool = syncPool;
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    try {
      console.log('\n🔧 [SQL] Initializing database schema...');

      // Create tenant table
      await execQuery(this.pool,
        `CREATE TABLE IF NOT EXISTS tenant (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          url VARCHAR(255),
          street VARCHAR(255),
          street2 VARCHAR(255),
          city VARCHAR(100),
          state VARCHAR(50),
          zip VARCHAR(20),
          country VARCHAR(100),
          active BOOLEAN DEFAULT true,
          api_key VARCHAR(255),
          download_batch_size INTEGER NOT NULL DEFAULT 1000,
          upload_batch_size INTEGER NOT NULL DEFAULT 100,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

      // Add batch size columns if they don't exist (for existing tables)
      await execQuery(this.pool,
        `ALTER TABLE tenant ADD COLUMN IF NOT EXISTS download_batch_size INTEGER NOT NULL DEFAULT 1000`);
      await execQuery(this.pool,
        `ALTER TABLE tenant ADD COLUMN IF NOT EXISTS upload_batch_size INTEGER NOT NULL DEFAULT 100`);

      // Create meter table
      await execQuery(this.pool,
        `CREATE TABLE IF NOT EXISTS meter (
          meter_id INTEGER PRIMARY KEY,
          device_id INTEGER,
          location_id INTEGER,
          ip VARCHAR(50),
          port VARCHAR(10),
          active BOOLEAN DEFAULT true,
          meter_element_id INTEGER,
          element VARCHAR(255)
        )`);

      // Create meter_reading table
      await execQuery(this.pool,
        `
         CREATE TABLE IF NOT EXISTS public.meter_reading
         (
             meter_reading_id uuid NOT NULL DEFAULT gen_random_uuid(),
             created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
             sync_status character varying(20) COLLATE pg_catalog."default",
             tenant_id bigint NOT NULL DEFAULT 0,
             meter_id bigint NOT NULL DEFAULT 0,
             active_energy numeric(18,4) DEFAULT 0,
             active_energy_export numeric(18,4) DEFAULT 0,
             apparent_energy numeric(18,4) DEFAULT 0,
             apparent_energy_export numeric(18,4) DEFAULT 0,
             apparent_power numeric(18,4) DEFAULT 0,
             apparent_power_phase_a numeric(18,4) DEFAULT 0,
             apparent_power_phase_b numeric(18,4) DEFAULT 0,
             apparent_power_phase_c numeric(18,4) DEFAULT 0,
             current numeric(18,4) DEFAULT 0,
             current_line_a numeric(18,4) DEFAULT 0,
             current_line_b numeric(18,4) DEFAULT 0,
             current_line_c numeric(18,4) DEFAULT 0,
             frequency numeric(18,4) DEFAULT 0,
             maximum_demand_real numeric(18,4) DEFAULT 0,
             power numeric(18,4) DEFAULT 0,
             power_factor numeric(18,4) DEFAULT 0,
             power_factor_phase_a numeric(18,4) DEFAULT 0,
             power_factor_phase_b numeric(18,4) DEFAULT 0,
             power_factor_phase_c numeric(18,4) DEFAULT 0,
             power_phase_a numeric(18,4) DEFAULT 0,
             power_phase_b numeric(18,4) DEFAULT 0,
             power_phase_c numeric(18,4) DEFAULT 0,
             reactive_energy numeric(18,4) DEFAULT 0,
             reactive_energy_export numeric(18,4) DEFAULT 0,
             reactive_power numeric(18,4) DEFAULT 0,
             reactive_power_phase_a numeric(18,4) DEFAULT 0,
             reactive_power_phase_b numeric(18,4) DEFAULT 0,
             reactive_power_phase_c numeric(18,4) DEFAULT 0,
             voltage_a_b numeric(18,4) DEFAULT 0,
             voltage_a_n numeric(18,4) DEFAULT 0,
             voltage_b_c numeric(18,4) DEFAULT 0,
             voltage_b_n numeric(18,4) DEFAULT 0,
             voltage_c_a numeric(18,4) DEFAULT 0,
             voltage_c_n numeric(18,4) DEFAULT 0,
             voltage_p_n numeric(18,4) DEFAULT 0,
             voltage_p_p numeric(18,4) DEFAULT 0,
             voltage_thd numeric(18,4) DEFAULT 0,
             voltage_thd_phase_a numeric(18,4) DEFAULT 0,
             voltage_thd_phase_b numeric(18,4) DEFAULT 0,
             voltage_thd_phase_c numeric(18,4) DEFAULT 0,
             meter_element_id bigint,
             is_synchronized boolean DEFAULT false,
             retry_count bigint DEFAULT 0,
             CONSTRAINT meter_readings_realtime_pkey PRIMARY KEY (meter_reading_id)
         )
        `);

      // Create sync_log table
      await execQuery(this.pool,
        `
        CREATE TABLE IF NOT EXISTS sync_log (
          id SERIAL PRIMARY KEY,
          operation_type VARCHAR(50),
          batch_size INTEGER,
          success BOOLEAN,
          error_message TEXT,
          synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);


      // Create device_register table
      await execQuery(this.pool,
        `
        CREATE TABLE IF NOT EXISTS device_register (
          device_register_id SERIAL PRIMARY KEY,
          device_id INTEGER NOT NULL,
          register_id INTEGER NOT NULL REFERENCES register(register_id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(device_id, register_id)
        )
      `);
      await execQuery(this.pool, `CREATE INDEX IF NOT EXISTS idx_meter_reading_meter_id ON meter_reading(meter_id)`);
      await execQuery(this.pool, `CREATE INDEX IF NOT EXISTS idx_meter_reading_is_synchronized ON meter_reading(is_synchronized)`);
      await execQuery(this.pool, `CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log(synced_at)`);
      await execQuery(this.pool, `CREATE INDEX IF NOT EXISTS idx_device_register_device_id ON device_register(device_id)`);
      await execQuery(this.pool, `CREATE INDEX IF NOT EXISTS idx_device_register_register_id ON device_register(register_id)`);

      console.log('✅ [SQL] Database schema initialized successfully');
    } catch (error) {
      console.error('❌ [SQL] Failed to initialize database schema:', error);
      throw error;
    }
  }

  /**
   * Test local database connectivity
   */
  async testConnectionLocal(): Promise<boolean> {
    try {
      const result = await execQuery(this.pool, 'SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ [SQL] Local database connection test failed:', error);
      return false;
    }
  }

  /**
   * Test remote database connectivity
   */
  async testConnectionRemote(remotePool: Pool): Promise<boolean> {
    try {
      const result = await execQuery(remotePool, 'SELECT NOW()');
      console.log('✅ [SQL] Remote database connection test successful, result:', result.rows[0]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ [SQL] Remote database connection test failed:', error);
      return false;
    }
  }

  /**
   * Validate that the tenant table exists and contains valid data
   * 
   * Returns:
   * - false if table doesn't exist
   * - false if table has zero records (sync database not set up yet)
   * - true if table has exactly one record (valid state)
   * - throws error if table has more than one record (database may be corrupted)
   */
  async validateTenantTable(): Promise<TenantEntity | null> {
    try {
      const query = 'SELECT TOP 2 * FROM tenant';
      const result = await execQuery(this.pool, query);
      const rowCount = result.rows.length;

      if (rowCount === 0) {
        console.warn('⚠️  [SQL] Tenant table exists but has no records - sync database not set up yet');
        return null;
      } else if (rowCount === 1) {
        console.log('✅ [SQL] Tenant table validation successful - found valid tenant record');
        return result.rows[0];
      } else {
        throw new Error(`Database integrity error: Tenant table contains ${rowCount} records instead of 1. Please contact support.`);
        console.error(`❌ [SQL] Tenant table contains ${rowCount} records - database may be corrupted`);
      }

      // More than one record - database may be corrupted
    } catch (error: any) {
      // Check if error is due to table not existing
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.error('❌ [SQL] Tenant table does not exist in the database');
        return null;
      }

      // Re-throw other errors (including corruption errors)
      if (error.message.includes('Database integrity error')) {
        throw error;
      }

      console.error('❌ [SQL] Failed to validate tenant table:', error);
      return null;
    }
  }


  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  // ==================== METER READING METHODS ====================

  /**
   * Insert a single meter reading
   */
  async insertReading(reading: {
    meter_id: string;
    timestamp: Date;
    data_point: string;
    value: number;
    unit?: string;
  }): Promise<MeterReadingEntity> {
    const result = await this.pool.query(
      `INSERT INTO meter_reading(meter_id, timestamp, data_point, value, unit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        reading.meter_id,
        reading.timestamp,
        reading.data_point,
        reading.value,
        reading.unit,
      ]
    );
    return result.rows[0];
  }

  /**
   * Batch insert meter readings
   */
  async batchInsertReadings(readings: Array<Omit<MeterReadingEntity, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
    if (readings.length === 0) {
      return 0;
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let insertedCount = 0;
      // for (const reading of readings) {
      //   await client.query(
      //     `INSERT INTO meter_reading (meter_external_id, timestamp, data_point, value, unit)
      //      VALUES ($1, $2, $3, $4, $5)`,
      //     [
      //       reading.meter_id,
      //       reading.timestamp,
      //       reading.data_point,
      //       reading.value,
      //       reading.unit,
      //     ]
      //   );
      //   insertedCount++;
      // }

      await client.query('COMMIT');
      return insertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }


  /**
   * Get recent readings (last N hours)
   */
  async getRecentReadings(hours: number = 24): Promise<MeterReadingEntity[]> {
    const query = `SELECT * FROM meter_reading
       WHERE created_at >= NOW() - INTERVAL '${hours} hours'
       ORDER BY created_at DESC`;
    const result = await execQuery(this.pool, query, [], 'data-sync.ts>getRecentReadings');
    return result.rows;
  }

  /**
   * Mark readings as synchronized
   * 
   * Updates both is_synchronized flag and sync_status column in a single query.
   * This ensures atomicity and reduces SQL operations.
   * 
   * @param readingIds - Array of reading IDs to mark as synchronized
   * @param tenantId - Optional tenant ID for filtering (for future multi-tenant support)
   * @returns Number of rows updated
   * @throws Error if the update fails
   */
  async markReadingsAsSynchronized(readingIds: string[], tenantId?: number): Promise<number> {
    if (readingIds.length === 0) {
      return 0;
    }

    try {
      let query: string;
      let params: any[];

      if (tenantId) {
        // Update with tenant filtering for multi-tenant support
        query = `UPDATE meter_reading
                 SET is_synchronized = true, sync_status = 'synchronized'
                 WHERE meter_reading_id = ANY($1::uuid[]) AND tenant_id = $2`;
        params = [readingIds, tenantId];
      } else {
        // Update without tenant filtering (backward compatible)
        query = `UPDATE meter_reading
                 SET is_synchronized = true, sync_status = 'synchronized'
                 WHERE meter_reading_id = ANY($1::uuid[])`;
        params = [readingIds];
      }

      const result = await this.pool.query(query, params);
      const updatedCount = result.rowCount || 0;

      console.log(`✅ [SQL] Marked ${updatedCount} reading(s) as synchronized${tenantId ? ` for tenant ${tenantId}` : ''}`);
      return updatedCount;
    } catch (error) {
      console.error('❌ [SQL] Failed to mark readings as synchronized:', error);
      throw error;
    }
  }



  /**
   * Delete old synchronized readings (cleanup)
   */
  async deleteOldSynchronizedReadings(daysOld: number = 7): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM meter_reading
       WHERE is_synchronized = true 
         AND created_at < NOW() - INTERVAL '${daysOld} days'`
    );
    return result.rowCount || 0;
  }

  // ==================== TENANT METHODS ====================

  /**
   * Get tenant information
   */
  async getTenant(): Promise<TenantEntity | null> {
    try {
      const query = 'SELECT * FROM tenant';
      const result = await execQuery(this.pool, query);
      const tenant = result.rows[0] || null;
      return tenant;
    } catch (error) {
      console.error('❌ [SQL] Error querying tenant:', error);
      throw error;
    }
  }

  /**
   * Get tenant batch size configuration
   * 
   * Retrieves the download_batch_size and upload_batch_size for a specific tenant.
   * Returns default values if tenant is not found or columns don't exist.
   * 
   * @param tenantId - The ID of the tenant
   * @returns Object with downloadBatchSize and uploadBatchSize
   * @throws Error if the query fails
   */
  async getTenantBatchConfig(tenantId: number): Promise<{ downloadBatchSize: number; uploadBatchSize: number }> {
    try {
      const query = `SELECT download_batch_size, upload_batch_size FROM tenant WHERE id = $1`;
      const result = await execQuery(this.pool, query, [tenantId], 'data-sync.ts>getTenantBatchConfig');

      if (result.rows.length === 0) {
        console.warn(`⚠️  [SQL] Tenant ${tenantId} not found, using default batch sizes`);
        return {
          downloadBatchSize: 1000,
          uploadBatchSize: 100
        };
      }

      const row = result.rows[0];
      const downloadBatchSize = row.download_batch_size || 1000;
      const uploadBatchSize = row.upload_batch_size || 100;

      console.log(`✅ [SQL] Retrieved batch config for tenant ${tenantId}:`, {
        downloadBatchSize,
        uploadBatchSize
      });

      return {
        downloadBatchSize,
        uploadBatchSize
      };
    } catch (error: any) {
      // If columns don't exist, log warning and return defaults
      if (error.message.includes('does not exist') || error.code === '42703') {
        console.warn(`⚠️  [SQL] Batch size columns do not exist in tenant table, using default values`);
        return {
          downloadBatchSize: 1000,
          uploadBatchSize: 100
        };
      }
      console.error('❌ [SQL] Error querying tenant batch config:', error);
      throw error;
    }
  }

  // /**
  //  * Synchronize tenant from remote database to local database
  //  * 
  //  * Queries the remote database for a tenant record by ID and upserts it to the local database.
  //  * Preserves the original tenant ID from the remote database.
  //  * 
  //  * @param remotePool - Connection pool to the remote database
  //  * @param tenantId - The ID of the tenant to synchronize
  //  * @returns The synchronized tenant record
  //  * @throws Error if the remote database query fails or tenant is not found
  //  */
  // async syncTenantFromRemote(remotePool: Pool, tenantId: number): Promise<TenantEntity> {
  //   try {
  //     // Query remote database for tenant record
  //     console.log(`\n🔍 [SYNC] Querying remote database for tenant : ${tenantId}`);
  //     const remoteQuery = 'SELECT * FROM tenant WHERE id = $1';
  //     const remoteResult = await remotePool.query(remoteQuery, [tenantId]);

  //     if (remoteResult.rows.length === 0) {
  //       throw new Error(`Tenant with ID ${tenantId} not found in remote database`);
  //     }

  //     const remoteRow = remoteResult.rows[0];
  //     console.log(`✅ [SYNC] Found tenant in remote database:`, JSON.stringify(remoteRow, null, 2));

  //     // Map remote row to TenantEntity
  //     const remoteTenant: TenantEntity = {
  //       tenant_id: remoteRow.id || remoteRow.tenant_id,
  //       name: remoteRow.name,
  //       url: remoteRow.url,
  //       street: remoteRow.street,
  //       street2: remoteRow.street2,
  //       city: remoteRow.city,
  //       state: remoteRow.state,
  //       zip: remoteRow.zip,
  //       country: remoteRow.country,
  //     };

  //     // Upsert to local database, preserving the original tenant ID
  //     console.log(`\n📝 [SYNC] Upserting tenant to local database with: ${remoteTenant.tenant_id}`);

  //     const existing = await this.getTenant();

  //     let localTenant: TenantEntity;

  //     if (existing) {
  //       // Update existing tenant, preserving the ID from remote
  //       const sql = `UPDATE tenant 
  //         SET name = $1, 
  //             url = $2, 
  //             street = $3, 
  //             street2 = $4, 
  //             city = $5, 
  //             state = $6, 
  //             zip = $7, 
  //             country = $8,
  //             updated_at = CURRENT_TIMESTAMP 
  //         WHERE id = $9 
  //         RETURNING *`;

  //       try {
  //         const updateResult = await this.pool.query(sql, [
  //           remoteTenant.name,
  //           remoteTenant.url || null,
  //           remoteTenant.street || null,
  //           remoteTenant.street2 || null,
  //           remoteTenant.city || null,
  //           remoteTenant.state || null,
  //           remoteTenant.zip || null,
  //           remoteTenant.country || null,
  //           existing.tenant_id
  //         ]);
  //         localTenant = updateResult.rows[0];
  //       } catch (error: any) {
  //         // If some columns don't exist, update with available fields
  //         if (error.message.includes('does not exist')) {
  //           console.warn('⚠️ [SYNC] Some columns do not exist, updating with available fields');
  //           const basicUpdateQuery = `UPDATE tenant 
  //             SET name = $1, 
  //                 updated_at = CURRENT_TIMESTAMP 
  //             WHERE tenant_id = $2 
  //             RETURNING *`;
  //           const basicUpdateResult = await this.pool.query(basicUpdateQuery, [
  //             remoteTenant.name,
  //             existing.tenant_id
  //           ]);
  //           localTenant = basicUpdateResult.rows[0];
  //         } else {
  //           throw error;
  //         }
  //       }
  //     } else {
  //       // Insert new tenant with the remote ID
  //       const insertQuery = `INSERT INTO tenant (id, name, url, street, street2, city, state, zip, country) 
  //         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
  //         RETURNING *`;

  //       try {
  //         const insertResult = await this.pool.query(insertQuery, [
  //           remoteTenant.tenant_id,
  //           remoteTenant.name,
  //           remoteTenant.url || null,
  //           remoteTenant.street || null,
  //           remoteTenant.street2 || null,
  //           remoteTenant.city || null,
  //           remoteTenant.state || null,
  //           remoteTenant.zip || null,
  //           remoteTenant.country || null
  //         ]);
  //         localTenant = insertResult.rows[0];
  //       } catch (error: any) {
  //         // If columns don't exist, insert with basic fields only
  //         if (error.message.includes('does not exist')) {
  //           console.warn('⚠️ [SYNC] Some columns do not exist, inserting with basic fields only');
  //           const basicInsertQuery = `INSERT INTO tenant (name) VALUES ($1) RETURNING *`;
  //           const basicInsertResult = await this.pool.query(basicInsertQuery, [remoteTenant.name]);
  //           localTenant = basicInsertResult.rows[0];
  //         } else {
  //           throw error;
  //         }
  //       }
  //     }

  //     console.log(`✅ [SYNC] Successfully synchronized tenant to local database:`, JSON.stringify(localTenant, null, 2));
  //     return localTenant;
  //   } catch (error) {
  //     console.error(`❌ [SYNC] Error synchronizing tenant from remote:`, error);
  //     throw error;
  //   }
  // }

  /**
   * Update tenant API key
   * 
   * Updates the API key for the existing tenant in the local database.
   * This is used to store the API key from the environment variable.
   * 
   * @param apiKey - The API key to store
   * @throws Error if the update fails
   */
  async updateTenantApiKey(apiKey: string): Promise<void> {
    try {
      console.log(`\n🔑 [SYNC] Updating tenant API key...`);

      const tenant = await this.getTenant();
      if (!tenant) {
        console.warn('⚠️  [SYNC] No tenant found, cannot update API key');
        return;
      }

      const sql = `UPDATE tenant SET api_key = $1 WHERE tenant_id = $2`;
      const result = await this.pool.query(sql, [apiKey, tenant.tenant_id]);

      if (result.rowCount === 0) {
        console.warn('⚠️  [SYNC] No rows updated when setting API key');
      } else {
        console.log(`✅ [SYNC] Successfully updated tenant API key: ${apiKey.substring(0, 8)}...`);
      }
    } catch (error: any) {
      // If api_key column doesn't exist, log warning but don't fail
      if (error.message.includes('does not exist') || error.code === '42703') {
        console.warn('⚠️  [SYNC] API key column does not exist in tenant table, skipping update');
      } else {
        console.error(`❌ [SYNC] Error updating tenant API key:`, error);
        throw error;
      }
    }
  }

  // ==================== SYNC LOG METHODS ====================


  /**
 * Delete old sync logs (cleanup)
 */
  async deleteOldSyncLogs(daysOld: number = 30): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM sync_log 
       WHERE synced_at < NOW() - INTERVAL '${daysOld} days'`
    );
    return result.rowCount || 0;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Execute a raw query (for advanced use cases)
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    return this.pool.query(text, params);
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  // ==================== INTERFACE IMPLEMENTATION METHODS ====================

  /**
   * Get all meters (implements SyncDatabase interface)
   * 
   * Returns each meter with its meter_element_id and element.
   * Each row represents one meter element that should be read independently.
   */
  async getMeters(activeOnly: boolean = true): Promise<MeterEntity[]> {
    const query = activeOnly
      ? `SELECT 
           meter_id, 
           name, 
           active, 
           ip, 
           port, 
           meter_element_id, 
           element, 
           device_id 
         FROM meter
         WHERE active = true 
         ORDER BY meter_id, meter_element_id`
      : `SELECT 
           meter_id, 
           name, 
           active, 
           ip, 
           port, 
           meter_element_id, 
           element, 
           device_id 
         FROM meter
         ORDER BY meter_id, meter_element_id`;

    console.log(`\n🔍 [DATA-SYNC] Executing getMeters query (activeOnly=${activeOnly})`);
    console.log(`   Query: ${query}`);

    const result = await execQuery(this.pool, query);

    console.log(`\n📊 [DATA-SYNC] getMeters returned ${result.rows.length} rows`);
    if (result.rows.length > 0) {
      console.log(`   First 3 rows:`);
      result.rows.slice(0, 3).forEach((row: any, idx: number) => {
        console.log(`     Row ${idx + 1}: meter_id=${row.meter_id}, element=${row.element}, meter_element_id=${row.meter_element_id}, name=${row.name}`);
      });
      if (result.rows.length > 3) {
        console.log(`   ... and ${result.rows.length - 3} more rows`);
      }
    }

    return result.rows;
  }

  /**
   * Create or update a meter (implements SyncDatabase interface)
   */
  async upsertMeter(meter: MeterEntity): Promise<void> {
    const meterId = meter?.meter_id || 'UNKNOWN';
    try {
      console.log(`\n🔄 [SYNC SQL] Starting upsert for meter: ${meterId}`);
      console.log(`   Input data:`, JSON.stringify(meter, null, 2));

      // Validate required fields
      if (!meter) {
        throw new Error('Meter object is required');
      }
      if (!meter.meter_id) {
        throw new Error('Meter ID is required for upsert');
      }

      // Prepare parameters
      const params = [
        meter.meter_id,
        meter.device_id,
        meter.name,
        meter.active !== undefined ? meter.active : true,
        meter.ip || null,
        meter.port || null,
        meter.meter_element_id || null,
        meter.element || null,
      ];

      console.log(`   ✓ All validations passed`);
      console.log(`   Executing INSERT/UPDATE query...`);

      const sql = `INSERT INTO meter (meter_id, device_id, name, active, ip, port, meter_element_id, element)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (meter_id, meter_element_id) DO UPDATE SET
           device_id = EXCLUDED.device_id,
           name = EXCLUDED.name,
           active = EXCLUDED.active,
           ip = EXCLUDED.ip,
           port = EXCLUDED.port,
           element = EXCLUDED.element
         RETURNING *`;
      console.log(`[SYNC SQL]  ${sql}`);
      console.log(`   Parameters:`, JSON.stringify(params, null, 2));
      const result = await this.pool.query(sql, params);

      if (!result || !result.rows || result.rows.length === 0) {
        throw new Error(`Upsert failed: No rows returned for meter ${meterId}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ [SYNC SQL] FAILED to upsert meter: ${meterId}`);
      console.error(`   Error Message: ${errorMessage}`);
      throw new Error(`Failed to upsert meter ${meterId}: ${errorMessage}`);
    }
  }

  /**
   * Log a sync operation (implements SyncDatabase interface)
   */
  async logSyncOperation(
    operationType: string,
    readingsCount: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO sync_log (operation_type, batch_size, success, error_message)
         VALUES ($1, $2, $3, $4)`,
        [operationType, readingsCount, success, errorMessage || null]
      );
      console.log(`✅ [SQL] Logged sync operation: type=${operationType}, count=${readingsCount}, success=${success}`);
    } catch (error) {
      console.error('❌ [SQL] Failed to log sync operation:', error);
      throw error;
    }
  }

  /**
   * Get unsynchronized readings for sync (implements SyncDatabase interface)
   * 
   * Retrieves unsynchronized readings ordered by timestamp ascending to maintain chronological order.
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  async getUnsynchronizedReadings(limit: number = 1000): Promise<MeterReadingEntity[]> {
    try {
      const query = `SELECT * FROM meter_reading
         WHERE is_synchronized = false
         ORDER BY created_at ASC
         LIMIT $1`;
      const result = await execQuery(this.pool, query, [limit], 'data-sync.ts>getUnsynchronizedReadings');
      return result.rows;
    } catch (error) {
      console.error('❌ [SQL] Failed to get unsynchronized readings:', error);
      throw error;
    }
  }

  /**
   * Delete synchronized readings (implements SyncDatabase interface)
   */
  async deleteSynchronizedReadings(readingIds: string[]): Promise<number> {
    if (readingIds.length === 0) {
      return 0;
    }

    try {
      const result = await this.pool.query(
        `DELETE FROM meter_reading
         WHERE meter_reading_id = ANY($1::uuid[]) AND is_synchronized = true`,
        [readingIds]
      );
      const deletedCount = result.rowCount || 0;
      console.log(`✅ [SQL] Deleted ${deletedCount} synchronized reading(s)`);
      return deletedCount;
    } catch (error) {
      console.error('❌ [SQL] Failed to delete synchronized readings:', error);
      throw error;
    }
  }

  /**
   * Increment retry count for failed readings (implements SyncDatabase interface)
   */
  async incrementRetryCount(readingIds: string[]): Promise<void> {
    if (readingIds.length === 0) {
      return;
    }

    try {
      await this.pool.query(
        `UPDATE meter_reading
         SET retry_count = retry_count + 1
         WHERE meter_reading_id = ANY($1::uuid[])`,
        [readingIds]
      );
      console.log(`✅ [SQL] Incremented retry count for ${readingIds.length} reading(s)`);
    } catch (error) {
      console.error('❌ [SQL] Failed to increment retry count:', error);
      throw error;
    }
  }

  /**
   * Mark readings as successfully uploaded
   */
  async markReadingsAsSuccessful(readingIds: string[]): Promise<void> {
    if (readingIds.length === 0) {
      return;
    }

    try {
      await this.pool.query(
        `UPDATE meter_reading
         SET sync_status = 'successful'
         WHERE meter_reading_id = ANY($1::uuid[])`,
        [readingIds]
      );
      console.log(`✅ [SQL] Marked ${readingIds.length} reading(s) as successful`);
    } catch (error) {
      console.error('❌ [SQL] Failed to mark readings as successful:', error);
      throw error;
    }
  }

  /**
   * Mark readings as pending (just collected from BACnet)
   */
  async markReadingsAsPending(readingIds: string[]): Promise<void> {
    if (readingIds.length === 0) {
      return;
    }

    try {
      await this.pool.query(
        `UPDATE meter_reading
         SET sync_status = 'pending'
         WHERE meter_reading_id = ANY($1::uuid[])`,
        [readingIds]
      );
      console.log(`✅ [SQL] Marked ${readingIds.length} reading(s) as pending`);
    } catch (error) {
      console.error('❌ [SQL] Failed to mark readings as pending:', error);
      throw error;
    }
  }

  /**
   * Delete meter readings older than cutoff date
   */
  async deleteOldReadings(cutoffDate: Date): Promise<number> {
    try {
      const result = await this.pool.query(
        `DELETE FROM meter_reading
         WHERE created_at < $1`,
        [cutoffDate]
      );
      const deletedCount = result.rowCount || 0;
      console.log(`✅ [SQL] Deleted ${deletedCount} old reading(s) before ${cutoffDate.toISOString()}`);
      return deletedCount;
    } catch (error) {
      console.error('❌ [SQL] Failed to delete old readings:', error);
      throw error;
    }
  }

  /**
   * Log meter reading collection failure
   */
  async logReadingFailure(meterId: string, operation: string, error: string): Promise<void> {
    try {
      // Get tenant ID from cache
      const tenantCache = require('../cache/cache-manager.js').cacheManager.getTenant();
      const tenantId = tenantCache?.tenant_id || 0;

      await this.pool.query(
        `INSERT INTO meter_reading (
          tenant_id, meter_id, created_at, sync_status
        ) VALUES ($1, $2, $3, $4)`,
        [
          tenantId,
          parseInt(meterId, 10),
          new Date(),
          `failed_${operation}`
        ]
      );
      console.log(`✅ [SQL] Logged reading failure for meter ${meterId}: ${operation} - ${error}`);
    } catch (err) {
      console.error('❌ [SQL] Failed to log reading failure:', err);
      // Don't throw - logging failures shouldn't break the collection cycle
    }
  }

  /**
   * Get sync statistics (implements SyncDatabase interface)
   */
  async getSyncStats(hours: number = 24): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT 
           COUNT(*) as total_syncs,
           SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_syncs,
           SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed_syncs,
           SUM(CASE WHEN success = true THEN batch_size ELSE 0 END) as total_readings_synced,
           MAX(synced_at) as last_sync_time
         FROM sync_log
         WHERE synced_at >= NOW() - INTERVAL '${hours} hours'`
      );

      const row = result.rows[0];
      const totalSyncs = parseInt(row.total_syncs, 10);
      const successfulSyncs = parseInt(row.successful_syncs || 0, 10);
      const failedSyncs = parseInt(row.failed_syncs || 0, 10);
      const totalReadingsSynced = parseInt(row.total_readings_synced || 0, 10);
      const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

      return {
        total_syncs: totalSyncs,
        successful_syncs: successfulSyncs,
        failed_syncs: failedSyncs,
        total_readings_synced: totalReadingsSynced,
        success_rate: Math.round(successRate * 100) / 100,
        last_sync_time: row.last_sync_time,
      };
    } catch (error) {
      console.error('❌ [SQL] Failed to get sync stats:', error);
      throw error;
    }
  }

  /**
   * Get recent sync logs (implements SyncDatabase interface)
   */
  async getRecentSyncLogs(limit: number = 100): Promise<SyncLog[]> {
    try {
      const query = `SELECT * FROM sync_log ORDER BY synced_at DESC LIMIT $1`;
      const result = await execQuery(this.pool, query, [limit], 'data-sync.ts>getRecentSyncLogs');
      return result.rows;
    } catch (error) {
      console.error('❌ [SQL] Failed to get recent sync logs:', error);
      throw error;
    }
  }

  // ==================== REGISTER METHODS ====================

  /**
   * Get all registers from the sync database (implements SyncDatabase interface)
   */
  async getRegisters(): Promise<any[]> {
    try {
      const query = `SELECT register_id, name, register, unit, field_name FROM register ORDER BY register_id`;
      const result = await execQuery(this.pool, query);
      return result.rows;
    } catch (error) {
      console.error('❌ [SQL] Failed to get registers:', error);
      throw error;
    }
  }

  /**
   * Upsert a register into the sync database (implements SyncDatabase interface)
   */
  async upsertRegister(register: any): Promise<void> {
    try {
      const registerId = register?.id || 'UNKNOWN';
      console.log(`\n🔄 [SYNC SQL] Starting upsert for register: ${registerId}`);
      console.log(`   Input data:`, JSON.stringify(register, null, 2));

      if (!register) {
        throw new Error('Register object is required');
      }
      if (!register.device_register_id) {
        throw new Error('Register ID is required for upsert');
      }

      const sql = `INSERT INTO register (register_id, name, register, unit, field_name)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           register = EXCLUDED.register,
           unit = EXCLUDED.unit,
           field_name = EXCLUDED.field_name
         RETURNING *`;

      console.log(`[SYNC SQL] ${sql}`);
      const params = [register.register_id, register.name, register.register, register.unit, register.field_name];
      console.log(`   Parameters:`, JSON.stringify(params, null, 2));

      const result = await this.pool.query(sql, params);

      if (!result || !result.rows || result.rows.length === 0) {
        throw new Error(`Upsert failed: No rows returned for register ${registerId}`);
      }

      console.log(`✅ [SYNC SQL] Successfully upserted register: ${registerId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ [SYNC SQL] FAILED to upsert register: ${register?.register_id || 'UNKNOWN'}`);
      console.error(`   Error Message: ${errorMessage}`);
      throw new Error(`Failed to upsert register ${register?.register_id || 'UNKNOWN'}: ${errorMessage}`);
    }
  }

  /**
   * Delete a register from the sync database (implements SyncDatabase interface)
   */
  async deleteRegister(registerId: number): Promise<void> {
    try {
      console.log(`\n🗑️  [SYNC SQL] Deleting register: ${registerId}`);
      const sql = `DELETE FROM register WHERE register_id = $1`;
      console.log(`[SYNC SQL] ${sql}`);
      console.log(`   Parameters: [${registerId}]`);

      const result = await this.pool.query(sql, [registerId]);
      console.log(`✅ [SYNC SQL] Successfully deleted register: ${registerId} (${result.rowCount} row(s) affected)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ [SYNC SQL] FAILED to delete register: ${registerId}`);
      console.error(`   Error Message: ${errorMessage}`);
      throw new Error(`Failed to delete register ${registerId}: ${errorMessage}`);
    }
  }

  // ==================== DEVICE_REGISTER METHODS ====================

  /**
   * Get all device_register associations from the sync database (implements SyncDatabase interface)
   */
  async getDeviceRegisters(): Promise<any[]> {
    try {
      console.log('📦 [SQL] Querying device_register associations from sync database...');
      const query = `SELECT dr.device_id, dr.register_id, r.register, r.field_name, r.unit
                     FROM device_register dr
                        JOIN register r ON r.register_id = dr.register_id 
                     ORDER BY dr.device_id, dr.register_id`;
      console.log(`📋 [SQL] Query: ${query}`);
      const result = await execQuery(this.pool, query, [], 'data-sync.ts>getDeviceRegisters');
      console.log(`✅ [SQL] Retrieved ${result.rows.length} device_register associations`);
      return result.rows;
    } catch (error) {
      console.error('❌ [SQL] Failed to get device_register associations from sync database:', error);
      throw error;
    }
  }

  /**
   * Upsert a device_register association into the sync database (implements SyncDatabase interface)
   */
  async upsertDeviceRegister(deviceRegister: any): Promise<void> {
    try {
      const key = `${deviceRegister?.device_id}-${deviceRegister?.register_id}` || 'UNKNOWN';
      console.log(`\n🔄 [SYNC SQL] Starting upsert for device_register: ${key}`);
      console.log(`   Input data:`, JSON.stringify(deviceRegister, null, 2));

      if (!deviceRegister) {
        throw new Error('Device_register object is required');
      }
      if (!deviceRegister.device_id || !deviceRegister.register_id) {
        throw new Error('Device ID and Register ID are required for upsert');
      }

      const sql = `
         INSERT INTO device_register (device_register_id, device_id, register_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (device_register_id, device_id, register_id)) DO UPDATE SET
           		 device_register_id=EXCLUDED.device_register_id,
               device_id = EXCLUDED.device_id,
               register_id = EXCLUDED.register_id
         RETURNING *`;

      console.log(`[SYNC SQL] ${sql}`);
      const params = [
        deviceRegister.device_register_id,
        deviceRegister.device_id,
        deviceRegister.register_id,
      ];
      console.log(`   Parameters:`, JSON.stringify(params, null, 2));

      const result = await this.pool.query(sql, params);

      if (!result || !result.rows || result.rows.length === 0) {
        throw new Error(`Upsert failed: No rows returned for device_register ${key}`);
      }

      console.log(`✅ [SYNC SQL] Successfully upserted device_register: ${key}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const key = `${deviceRegister?.device_id}-${deviceRegister?.register_id}` || 'UNKNOWN';
      console.error(`\n❌ [SYNC SQL] FAILED to upsert device_register: ${key}`);
      console.error(`   Error Message: ${errorMessage}`);
      throw new Error(`Failed to upsert device_register ${key}: ${errorMessage}`);
    }
  }

  /**
   * Delete a device_register association from the sync database (implements SyncDatabase interface)
   */
  async deleteDeviceRegister(deviceId: number, registerId: number): Promise<void> {
    try {
      const key = `${deviceId}-${registerId}`;
      console.log(`\n🗑️  [SYNC SQL] Deleting device_register: ${key}`);
      const sql = `DELETE FROM device_register WHERE device_id = $1 AND register_id = $2`;
      console.log(`[SYNC SQL] ${sql}`);
      console.log(`   Parameters: [${deviceId}, ${registerId}]`);

      const result = await this.pool.query(sql, [deviceId, registerId]);
      console.log(`✅ [SYNC SQL] Successfully deleted device_register: ${key} (${result.rowCount} row(s) affected)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const key = `${deviceId}-${registerId}`;
      console.error(`\n❌ [SYNC SQL] FAILED to delete device_register: ${key}`);
      console.error(`   Error Message: ${errorMessage}`);
      throw new Error(`Failed to delete device_register ${key}: ${errorMessage}`);
    }
  }
}

/**
 * Create a database instance from environment variables (legacy)
 * @deprecated Use initializePools() and access syncPool/remotePool directly instead
 */
export function createDatabaseFromEnv(): SyncDatabase {
  const config: DatabaseConfig = {
    host: process.env.POSTGRES_SYNC_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
    database: process.env.POSTGRES_SYNC_DB || 'postgres',
    user: process.env.POSTGRES_SYNC_USER || 'postgres',
    password: process.env.POSTGRES_SYNC_PASSWORD || '',
  };

  console.log('\n📊 [Database Config] Loading PostgreSQL configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${config.password ? '***' : '(empty)'}`);
  console.log(`   Connection String: postgresql://${config.user}@${config.host}:${config.port}/${config.database}\n`);

  return new SyncDatabase(config);
}
