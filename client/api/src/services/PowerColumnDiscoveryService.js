/**
 * Power Column Discovery Service
 * 
 * Discovers numeric power columns from the meter_reading table schema.
 * Implements caching with invalidation logic.
 * Uses register names for column labels.
 */

const db = require('../config/database');

// Cache for register mappings
let registerMappings = null;
let registerMappingsTimestamp = null;
const REGISTER_CACHE_TTL = 3600000; // 1 hour

class PowerColumnDiscoveryService {
  constructor() {
    this.cache = null;
    this.cacheTimestamp = null;
    this.cacheTTL = 3600000; // 1 hour in milliseconds
    
    // System columns to filter out
    this.systemColumns = new Set([
      'id',
      'created_at',
      'updated_at',
      'createdat',
      'updatedat',
      'tenant_id',
      'meter_id',
      'meterid',
      'meter_element_id',
      'meter_element_id',
      'is_synchronized',
      'retry_count',
      'sync_status',
      'status',
      'reading_date',
      'device_ip',
      'deviceip',
      'ip',
      'port',
      'source',
      'unit_of_measurement',
      'data_quality',
      'quality',
      'final_value'
    ]);

    // Numeric data types in PostgreSQL
    this.numericTypes = new Set([
      'integer',
      'bigint',
      'smallint',
      'numeric',
      'decimal',
      'real',
      'double precision',
      'int2',
      'int4',
      'int8',
      'float4',
      'float8'
    ]);
  }

  /**
   * Discover numeric power columns from meter_reading table
   * @returns {Promise<Array>} Array of column metadata objects
   */
  async discoverColumns() {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        console.log('📊 [PowerColumnDiscovery] Using cached columns');
        return this.cache;
      }

      console.log('📊 [PowerColumnDiscovery] Querying database schema...');

      // Query PostgreSQL information_schema to get column information
      const query = `
        SELECT 
          column_name,
          data_type,
          udt_name,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'meter_reading'
        ORDER BY ordinal_position
      `;

      const result = await db.query(query);
      const columns = result.rows || [];

      // Filter columns
      const numericColumns = columns.filter(col => this.isNumericColumn(col));

      // Transform columns (now async)
      const powerColumns = await Promise.all(
        numericColumns.map(col => this.transformColumnMetadata(col))
      );

      // Update cache
      this.cache = powerColumns;
      this.cacheTimestamp = Date.now();

      console.log(`📊 [PowerColumnDiscovery] Discovered ${powerColumns.length} power columns`);
      return powerColumns;
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [PowerColumnDiscovery] Error discovering columns:', err.message);
      throw error;
    }
  }

  /**
   * Check if a column is numeric and not a system column
   * @param {Object} column - Column metadata from information_schema
   * @returns {boolean} True if column is numeric and not a system column
   */
  isNumericColumn(column) {
    const columnName = column.column_name.toLowerCase();
    const dataType = (column.data_type || column.udt_name || '').toLowerCase();

    // Filter out system columns
    if (this.systemColumns.has(columnName)) {
      return false;
    }

    // Check if data type is numeric
    return this.numericTypes.has(dataType);
  }

  /**
   * Transform column metadata into API response format
   * @param {Object} column - Column metadata from information_schema
   * @returns {Promise<Object>} Transformed column metadata
   */
  async transformColumnMetadata(column) {
    const columnName = column.column_name;
    const dataType = column.data_type || column.udt_name;

    // Generate human-readable label from column name (with register names)
    const label = await this.generateLabel(columnName);

    return {
      name: columnName,
      type: dataType,
      label: label,
      nullable: column.is_nullable === 'YES',
      hasDefault: column.column_default !== null
    };
  }

  /**
   * Generate human-readable label from column name
   * Uses register names if available, falls back to formatted column name
   * @param {string} columnName - Database column name
   * @returns {Promise<string>} Human-readable label
   */
  async generateLabel(columnName) {
    try {
      // Fetch register mappings if not cached
      if (!registerMappings || !this.isRegisterCacheValid()) {
        await this.fetchRegisterMappings();
      }

      // Look up register name
      if (registerMappings && registerMappings[columnName]) {
        const register = registerMappings[columnName];
        if (register.unit) {
          return `${register.name} (${register.unit})`;
        }
        return register.name;
      }
    } catch (error) {
      console.warn(`⚠️ [PowerColumnDiscovery] Failed to fetch register for ${columnName}, using fallback`);
    }

    // Fallback: Convert snake_case to Title Case
    return columnName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Fetch register mappings from database
   */
  async fetchRegisterMappings() {
    try {
      const result = await db.query(
        `SELECT field_name, name, unit FROM register ORDER BY field_name`
      );

      registerMappings = {};
      result.rows.forEach(row => {
        registerMappings[row.field_name] = {
          name: row.name,
          unit: row.unit
        };
      });

      registerMappingsTimestamp = Date.now();
      console.log(`📊 [PowerColumnDiscovery] Loaded ${result.rows.length} register mappings`);
    } catch (error) {
      console.error('❌ [PowerColumnDiscovery] Failed to fetch register mappings:', error.message);
      registerMappings = null;
    }
  }

  /**
   * Check if register cache is still valid
   */
  isRegisterCacheValid() {
    if (!registerMappings || !registerMappingsTimestamp) {
      return false;
    }

    const now = Date.now();
    const age = now - registerMappingsTimestamp;
    return age < REGISTER_CACHE_TTL;
  }

  /**
   * Check if cache is still valid
   * @returns {boolean} True if cache is valid and not expired
   */
  isCacheValid() {
    if (!this.cache || !this.cacheTimestamp) {
      return false;
    }

    const now = Date.now();
    const age = now - this.cacheTimestamp;

    return age < this.cacheTTL;
  }

  /**
   * Invalidate the cache
   */
  invalidateCache() {
    console.log('📊 [PowerColumnDiscovery] Invalidating cache');
    this.cache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      isCached: this.cache !== null,
      columnCount: this.cache ? this.cache.length : 0,
      cacheAge: this.cacheTimestamp ? Date.now() - this.cacheTimestamp : null,
      cacheTTL: this.cacheTTL,
      isValid: this.isCacheValid()
    };
  }
}

// Export singleton instance
module.exports = new PowerColumnDiscoveryService();
