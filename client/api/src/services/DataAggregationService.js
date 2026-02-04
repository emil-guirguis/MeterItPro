/**
 * Data Aggregation Service
 * 
 * Aggregates meter reading data for dashboard cards based on selected columns and time frames.
 * Implements different aggregation strategies for different column types:
 * - SUM for energy columns (kWh, reactive energy, etc.)
 * - MAX for instantaneous power columns (kW, apparent power, etc.)
 * - AVG for factor columns (power factor, voltage THD, etc.)
 */

const db = require('../config/database');

class DataAggregationService {
  constructor() {
    // Column type mappings for aggregation strategy
    this.energyColumnPatterns = [
      'energy',
      'kwh',
      'kvarh',
      'kvah',
      'wh',
      'varh',
      'vah'
    ];

    this.powerColumnPatterns = [
      'power',
      'kw',
      'kvar',
      'kva',
      'w',
      'var',
      'va',
      'current',
      'voltage'
    ];

    this.factorColumnPatterns = [
      'factor',
      'thd',
      'distortion',
      'harmonic'
    ];
  }

  /**
   * Aggregate card data based on selected columns and time frame
   * 
   * @param {Object} options - Aggregation options
   * @param {number} options.meterElementId - Meter element ID
   * @param {number} options.tenantId - Tenant ID
   * @param {Array<string>} options.selectedColumns - Array of column names to aggregate
   * @param {Date} options.startDate - Start date for time frame
   * @param {Date} options.endDate - End date for time frame
   * @returns {Promise<Object>} Aggregated values object
   * @throws {Error} If aggregation fails or parameters are invalid
   */
  async aggregateCardData(options) {
    try {
      const { meterElementId, tenantId, selectedColumns, startDate, endDate } = options;

      // Validate required parameters
      this.validateAggregationOptions(options);

      console.log(`📊 [DataAggregation] Aggregating data for meter element ${meterElementId}`);
      console.log(`   Columns: ${selectedColumns.join(', ')}`);
      console.log(`   Time frame: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Build aggregation query
      const query = this.buildAggregationQuery(selectedColumns);

      // Execute query
      const result = await db.query(query, [
        tenantId,
        meterElementId,
        startDate.toISOString(),
        endDate.toISOString()
      ]);

      // Handle empty result sets
      if (!result.rows || result.rows.length === 0) {
        console.log('📊 [DataAggregation] No meter readings found for aggregation');
        return this.getEmptyAggregationResult(selectedColumns);
      }

      const aggregatedData = result.rows[0];
      console.log(`✅ [DataAggregation] Aggregation complete:`, aggregatedData);

      return aggregatedData;
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [DataAggregation] Error aggregating data:', err.message);
      throw error;
    }
  }

  /**
   * Validate aggregation options
   * 
   * @param {Object} options - Options to validate
   * @throws {Error} If validation fails
   */
  validateAggregationOptions(options) {
    const { meterElementId, tenantId, selectedColumns, startDate, endDate } = options;

    if (!meterElementId) {
      throw new Error('meterElementId is required');
    }

    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    if (!selectedColumns || !Array.isArray(selectedColumns) || selectedColumns.length === 0) {
      throw new Error('selectedColumns must be a non-empty array');
    }

    if (!startDate) {
      throw new Error('startDate is required');
    }

    if (!endDate) {
      throw new Error('endDate is required');
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw new Error('Invalid startDate');
    }

    if (isNaN(end.getTime())) {
      throw new Error('Invalid endDate');
    }

    if (start >= end) {
      throw new Error('startDate must be before endDate');
    }
  }

  /**
   * Build SQL aggregation query based on selected columns
   * 
   * @param {Array<string>} selectedColumns - Array of column names to aggregate
   * @returns {string} SQL query string
   */
  buildAggregationQuery(selectedColumns) {
    // Build SELECT clause with appropriate aggregation functions
    const selectClauses = selectedColumns.map(column => {
      const aggregationFunction = this.getAggregationFunction(column);
      return `${aggregationFunction}("${column}") as "${column}"`;
    });

    const selectClause = selectClauses.join(',\n  ');

    const query = `
      SELECT
        ${selectClause}
      FROM meter_reading
      WHERE
        tenant_id = $1
        AND meter_element_id = $2
        AND created_at >= $3
        AND created_at <= $4
    `;

    return query;
  }

  /**
   * Determine the appropriate aggregation function for a column
   * 
   * @param {string} columnName - Column name
   * @returns {string} Aggregation function (SUM, MAX, AVG)
   */
  getAggregationFunction(columnName) {
    const lowerName = columnName.toLowerCase();

    // Check energy columns (use SUM)
    if (this.energyColumnPatterns.some(pattern => lowerName.includes(pattern))) {
      return 'SUM';
    }

    // Check factor columns (use AVG)
    if (this.factorColumnPatterns.some(pattern => lowerName.includes(pattern))) {
      return 'AVG';
    }

    // Check power columns (use MAX)
    if (this.powerColumnPatterns.some(pattern => lowerName.includes(pattern))) {
      return 'MAX';
    }

    // Default to SUM for unknown numeric columns
    return 'SUM';
  }

  /**
   * Get empty aggregation result with null values for all columns
   * 
   * @param {Array<string>} selectedColumns - Array of column names
   * @returns {Object} Object with null values for each column
   */
  getEmptyAggregationResult(selectedColumns) {
    const result = {};
    selectedColumns.forEach(column => {
      result[column] = null;
    });
    return result;
  }

  /**
   * Get aggregation statistics for a meter element
   * 
   * @param {number} meterElementId - Meter element ID
   * @param {number} tenantId - Tenant ID
   * @returns {Promise<Object>} Statistics object
   */
  async getAggregationStats(meterElementId, tenantId) {
    try {
      const query = `
        SELECT
          COUNT(*) as total_readings,
          MIN(created_at) as earliest_reading,
          MAX(created_at) as latest_reading,
          COUNT(DISTINCT DATE(created_at)) as days_with_readings
        FROM meter_reading
        WHERE meter_element_id = $1 AND tenant_id = $2
      `;

      const result = await db.query(query, [meterElementId, tenantId]);

      if (!result.rows || result.rows.length === 0) {
        return {
          total_readings: 0,
          earliest_reading: null,
          latest_reading: null,
          days_with_readings: 0
        };
      }

      return result.rows[0];
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [DataAggregation] Error getting aggregation stats:', err.message);
      throw error;
    }
  }

  /**
   * Validate that selected columns exist in meter_reading table
   * 
   * @param {Array<string>} selectedColumns - Column names to validate
   * @returns {Promise<Object>} Validation result with valid and invalid columns
   */
  async validateSelectedColumns(selectedColumns) {
    try {
      const query = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'meter_reading'
        AND column_name = ANY($1)
      `;

      const result = await db.query(query, [selectedColumns]);

      const validColumns = (result.rows || []).map(row => {
        return (/** @type {any} */ (row)).column_name;
      });
      const invalidColumns = selectedColumns.filter(col => !validColumns.includes(col));

      return {
        valid: validColumns,
        invalid: invalidColumns,
        isValid: invalidColumns.length === 0
      };
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [DataAggregation] Error validating columns:', err.message);
      throw error;
    }
  }

  /**
   * Get column statistics for a specific column
   * 
   * @param {string} columnName - Column name
   * @param {number} meterElementId - Meter element ID
   * @param {number} tenantId - Tenant ID
   * @returns {Promise<Object>} Column statistics
   */
  async getColumnStats(columnName, meterElementId, tenantId) {
    try {
      const query = `
        SELECT
          COUNT(*) as count,
          COUNT(DISTINCT "${columnName}") as distinct_count,
          MIN("${columnName}") as min_value,
          MAX("${columnName}") as max_value,
          AVG("${columnName}") as avg_value,
          SUM("${columnName}") as sum_value
        FROM meter_reading
        WHERE meter_element_id = $1 AND tenant_id = $2 AND "${columnName}" IS NOT NULL
      `;

      const result = await db.query(query, [meterElementId, tenantId]);

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [DataAggregation] Error getting column stats:', err.message);
      throw error;
    }
  }

  /**
   * Aggregate card data by day
   * 
   * @param {Object} options - Aggregation options
   * @param {number} options.meterElementId - Meter element ID
   * @param {number} options.tenantId - Tenant ID
   * @param {Array<string>} options.selectedColumns - Array of column names to aggregate
   * @param {Date} options.startDate - Start date for time frame
   * @param {Date} options.endDate - End date for time frame
   * @returns {Promise<Array>} Array of daily aggregated values
   * @throws {Error} If aggregation fails or parameters are invalid
   */
  async aggregateCardDataByDay(options) {
    try {
      const { meterElementId, tenantId, selectedColumns, startDate, endDate } = options;

      // Validate required parameters
      this.validateAggregationOptions(options);

      console.log(`📊 [DataAggregation] Aggregating daily data for meter element ${meterElementId}`);
      console.log(`   Columns: ${selectedColumns.join(', ')}`);
      console.log(`   Time frame: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Build daily aggregation query
      const query = this.buildDailyAggregationQuery(selectedColumns);

      // Execute query
      const result = await db.query(query, [
        tenantId,
        meterElementId,
        startDate.toISOString(),
        endDate.toISOString()
      ]);

      // Handle empty result sets
      if (!result.rows || result.rows.length === 0) {
        console.log('📊 [DataAggregation] No meter readings found for daily aggregation');
        return [];
      }

      console.log(`✅ [DataAggregation] Daily aggregation complete: ${result.rows.length} days`);

      return result.rows;
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [DataAggregation] Error aggregating daily data:', err.message);
      throw error;
    }
  }

  /**
   * Build SQL daily aggregation query based on selected columns
   * 
   * @param {Array<string>} selectedColumns - Array of column names to aggregate
   * @returns {string} SQL query string
   */
  buildDailyAggregationQuery(selectedColumns) {
    // Build SELECT clause with appropriate aggregation functions
    const selectClauses = selectedColumns.map(column => {
      const aggregationFunction = this.getAggregationFunction(column);
      return `${aggregationFunction}("${column}") as "${column}"`;
    });

    const selectClause = selectClauses.join(',\n  ');

    const query = `
      SELECT
        DATE(created_at) as date,
        ${selectClause}
      FROM meter_reading
      WHERE
        tenant_id = $1
        AND meter_element_id = $2
        AND created_at >= $3
        AND created_at <= $4
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;

    return query;
  }

  /**
   * Aggregate card data by hour
   * 
   * @param {Object} options - Aggregation options
   * @param {number} options.meterElementId - Meter element ID
   * @param {number} options.tenantId - Tenant ID
   * @param {Array<string>} options.selectedColumns - Array of column names to aggregate
   * @param {Date} options.startDate - Start date for time frame
   * @param {Date} options.endDate - End date for time frame
   * @returns {Promise<Array>} Array of hourly aggregated values
   * @throws {Error} If aggregation fails or parameters are invalid
   */
  async aggregateCardDataByHour(options) {
    try {
      const { meterElementId, tenantId, selectedColumns, startDate, endDate } = options;

      // Validate required parameters
      this.validateAggregationOptions(options);

      console.log(`📊 [DataAggregation] Aggregating hourly data for meter element ${meterElementId}`);
      console.log(`   Columns: ${selectedColumns.join(', ')}`);
      console.log(`   Time frame: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Build hourly aggregation query
      const query = this.buildHourlyAggregationQuery(selectedColumns);

      // Execute query
      const result = await db.query(query, [
        tenantId,
        meterElementId,
        startDate.toISOString(),
        endDate.toISOString()
      ]);

      // Handle empty result sets
      if (!result.rows || result.rows.length === 0) {
        console.log('📊 [DataAggregation] No meter readings found for hourly aggregation');
        return [];
      }

      console.log(`✅ [DataAggregation] Hourly aggregation complete: ${result.rows.length} hours`);

      return result.rows;
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [DataAggregation] Error aggregating hourly data:', err.message);
      throw error;
    }
  }

  /**
   * Build SQL hourly aggregation query based on selected columns
   * 
   * @param {Array<string>} selectedColumns - Array of column names to aggregate
   * @returns {string} SQL query string
   */
  buildHourlyAggregationQuery(selectedColumns) {
    // Build SELECT clause with appropriate aggregation functions
    const selectClauses = selectedColumns.map(column => {
      const aggregationFunction = this.getAggregationFunction(column);
      return `${aggregationFunction}("${column}") as "${column}"`;
    });

    const selectClause = selectClauses.join(',\n  ');

    const query = `
      SELECT
        DATE(created_at) as date,
        EXTRACT(HOUR FROM created_at) as hour,
        ${selectClause}
      FROM meter_reading
      WHERE
        tenant_id = $1
        AND meter_element_id = $2
        AND created_at >= $3
        AND created_at <= $4
      GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at)
      ORDER BY DATE(created_at) ASC, EXTRACT(HOUR FROM created_at) ASC
    `;

    return query;
  }

  /**
   * Aggregate card data by week
   * 
   * @param {Object} options - Aggregation options
   * @param {number} options.meterElementId - Meter element ID
   * @param {number} options.tenantId - Tenant ID
   * @param {Array<string>} options.selectedColumns - Array of column names to aggregate
   * @param {Date} options.startDate - Start date for time frame
   * @param {Date} options.endDate - End date for time frame
   * @returns {Promise<Array>} Array of weekly aggregated values
   * @throws {Error} If aggregation fails or parameters are invalid
   */
  async aggregateCardDataByWeek(options) {
    try {
      const { meterElementId, tenantId, selectedColumns, startDate, endDate } = options;

      // Validate required parameters
      this.validateAggregationOptions(options);

      console.log(`📊 [DataAggregation] Aggregating weekly data for meter element ${meterElementId}`);
      console.log(`   Columns: ${selectedColumns.join(', ')}`);
      console.log(`   Time frame: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Build weekly aggregation query
      const query = this.buildWeeklyAggregationQuery(selectedColumns);

      // Execute query
      const result = await db.query(query, [
        tenantId,
        meterElementId,
        startDate.toISOString(),
        endDate.toISOString()
      ]);

      // Handle empty result sets
      if (!result.rows || result.rows.length === 0) {
        console.log('📊 [DataAggregation] No meter readings found for weekly aggregation');
        return [];
      }

      console.log(`✅ [DataAggregation] Weekly aggregation complete: ${result.rows.length} weeks`);

      return result.rows;
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [DataAggregation] Error aggregating weekly data:', err.message);
      throw error;
    }
  }

  /**
   * Build SQL weekly aggregation query based on selected columns
   * 
   * @param {Array<string>} selectedColumns - Array of column names to aggregate
   * @returns {string} SQL query string
   */
  buildWeeklyAggregationQuery(selectedColumns) {
    // Build SELECT clause with appropriate aggregation functions
    const selectClauses = selectedColumns.map(column => {
      const aggregationFunction = this.getAggregationFunction(column);
      return `${aggregationFunction}("${column}") as "${column}"`;
    });

    const selectClause = selectClauses.join(',\n  ');

    const query = `
      SELECT
        DATE_TRUNC('week', created_at) as week_start,
        ${selectClause}
      FROM meter_reading
      WHERE
        tenant_id = $1
        AND meter_element_id = $2
        AND created_at >= $3
        AND created_at <= $4
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY DATE_TRUNC('week', created_at) ASC
    `;

    return query;
  }

  /**
   * Aggregate card data by month
   * 
   * @param {Object} options - Aggregation options
   * @param {number} options.meterElementId - Meter element ID
   * @param {number} options.tenantId - Tenant ID
   * @param {Array<string>} options.selectedColumns - Array of column names to aggregate
   * @param {Date} options.startDate - Start date for time frame
   * @param {Date} options.endDate - End date for time frame
   * @returns {Promise<Array>} Array of monthly aggregated values
   * @throws {Error} If aggregation fails or parameters are invalid
   */
  async aggregateCardDataByMonth(options) {
    try {
      const { meterElementId, tenantId, selectedColumns, startDate, endDate } = options;

      // Validate required parameters
      this.validateAggregationOptions(options);

      console.log(`📊 [DataAggregation] Aggregating monthly data for meter element ${meterElementId}`);
      console.log(`   Columns: ${selectedColumns.join(', ')}`);
      console.log(`   Time frame: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Build monthly aggregation query
      const query = this.buildMonthlyAggregationQuery(selectedColumns);

      // Execute query
      const result = await db.query(query, [
        tenantId,
        meterElementId,
        startDate.toISOString(),
        endDate.toISOString()
      ]);

      // Handle empty result sets
      if (!result.rows || result.rows.length === 0) {
        console.log('📊 [DataAggregation] No meter readings found for monthly aggregation');
        return [];
      }

      console.log(`✅ [DataAggregation] Monthly aggregation complete: ${result.rows.length} months`);

      return result.rows;
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [DataAggregation] Error aggregating monthly data:', err.message);
      throw error;
    }
  }

  /**
   * Build SQL monthly aggregation query based on selected columns
   * 
   * @param {Array<string>} selectedColumns - Array of column names to aggregate
   * @returns {string} SQL query string
   */
  buildMonthlyAggregationQuery(selectedColumns) {
    // Build SELECT clause with appropriate aggregation functions
    const selectClauses = selectedColumns.map(column => {
      const aggregationFunction = this.getAggregationFunction(column);
      return `${aggregationFunction}("${column}") as "${column}"`;
    });

    const selectClause = selectClauses.join(',\n  ');

    const query = `
      SELECT
        DATE_TRUNC('month', created_at) as month_start,
        ${selectClause}
      FROM meter_reading
      WHERE
        tenant_id = $1
        AND meter_element_id = $2
        AND created_at >= $3
        AND created_at <= $4
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `;

    return query;
  }

  /**
   * Get aggregated data based on grouping type
   * 
   * @param {Object} options - Aggregation options
   * @param {number} options.meterElementId - Meter element ID
   * @param {number} options.tenantId - Tenant ID
   * @param {Array<string>} options.selectedColumns - Array of column names to aggregate
   * @param {Date} options.startDate - Start date for time frame
   * @param {Date} options.endDate - End date for time frame
   * @param {string} options.groupingType - Type of grouping (total, hourly, daily, weekly, monthly)
   * @returns {Promise<Array|Object>} Aggregated data based on grouping type
   * @throws {Error} If aggregation fails or parameters are invalid
   */
  async getAggregatedDataByGrouping(options) {
    const { groupingType = 'daily' } = options;

    switch (groupingType) {
      case 'total':
        return await this.aggregateCardData(options);
      case 'hourly':
        return await this.aggregateCardDataByHour(options);
      case 'daily':
        return await this.aggregateCardDataByDay(options);
      case 'weekly':
        return await this.aggregateCardDataByWeek(options);
      case 'monthly':
        return await this.aggregateCardDataByMonth(options);
      default:
        throw new Error(`Unsupported grouping type: ${groupingType}`);
    }
  }
}

// Export singleton instance
module.exports = new DataAggregationService();
