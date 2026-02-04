/**
 * Time Frame Calculation Service
 * 
 * Calculates time frame boundaries for dashboard cards based on preset or custom configurations.
 * Supports: last_month, this_month_to_date, since_installation, and custom date ranges.
 */

const db = require('../config/database');

class TimeFrameCalculationService {
  /**
   * Calculate time frame boundaries based on type and parameters
   * 
   * @param {string} timeFrameType - Type of time frame: 'custom', 'last_month', 'this_month_to_date', 'since_installation'
   * @param {Object} [options] - Additional options
   * @param {Date} [options.customStartDate] - Start date for custom time frame
   * @param {Date} [options.customEndDate] - End date for custom time frame
   * @param {number} [options.meterElementId] - Meter element ID (required for 'since_installation')
   * @param {number} [options.tenantId] - Tenant ID (required for 'since_installation')
   * @returns {Promise<Object>} Object with start and end dates: { start: Date, end: Date }
   * @throws {Error} If validation fails or required parameters are missing
   */
  async calculateTimeFrame(timeFrameType, options = {}) {
    try {
      // Validate time frame type
      this.validateTimeFrameType(timeFrameType);

      switch (timeFrameType) {
        case 'custom':
          return this.calculateCustomTimeFrame(options);

        case 'last_month':
          return this.calculateLastMonth();

        case 'this_month_to_date':
          return this.calculateThisMonthToDate();
          
        case 'year_to_date':
          return this.calculateYearToDate();

        case 'since_installation':
          return this.calculateSinceInstallation(options);

        default:
          throw new Error(`Unsupported time frame type: ${timeFrameType}`);
      }
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [TimeFrameCalculation] Error calculating time frame:', err.message);
      throw error;
    }
  }

  /**
   * Validate time frame type
   * 
   * @param {string} timeFrameType - Time frame type to validate
   * @throws {Error} If time frame type is invalid
   */
  validateTimeFrameType(timeFrameType) {
    const validTypes = ['custom', 'last_month', 'this_month_to_date', 'since_installation'];
    if (!validTypes.includes(timeFrameType)) {
      throw new Error(
        `Invalid time frame type: ${timeFrameType}. Must be one of: ${validTypes.join(', ')}`
      );
    }
  }

  /**
   * Calculate custom date range time frame
   * 
   * @param {Object} options - Options object
   * @param {Date} [options.customStartDate] - Start date
   * @param {Date} [options.customEndDate] - End date
   * @returns {Object} Object with start and end dates
   * @throws {Error} If dates are invalid or missing
   */
  calculateCustomTimeFrame(options) {
    const { customStartDate, customEndDate } = options;

    // Validate dates are provided
    if (!customStartDate) {
      throw new Error('customStartDate is required for custom time frame');
    }
    if (!customEndDate) {
      throw new Error('customEndDate is required for custom time frame');
    }

    // Convert to Date objects if they're strings
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);

    // Validate dates are valid
    if (isNaN(startDate.getTime())) {
      throw new Error(`Invalid start date: ${customStartDate}`);
    }
    if (isNaN(endDate.getTime())) {
      throw new Error(`Invalid end date: ${customEndDate}`);
    }

    // Validate start date is before end date
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    console.log(`📅 [TimeFrameCalculation] Custom time frame: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    return {
      start: startDate,
      end: endDate,
      type: 'custom'
    };
  }

  /**
   * Calculate last month time frame
   * Returns the previous calendar month (1st to last day)
   * 
   * @returns {Object} Object with start and end dates
   */
  calculateLastMonth() {
    const now = new Date();

    // Get the first day of the current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get the last day of the previous month (which is the day before current month start)
    const lastMonthEnd = new Date(currentMonthStart.getTime() - 1);

    // Get the first day of the previous month
    const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);

    // Set end date to end of day
    lastMonthEnd.setHours(23, 59, 59, 999);

    console.log(`📅 [TimeFrameCalculation] Last month: ${lastMonthStart.toISOString()} to ${lastMonthEnd.toISOString()}`);

    return {
      start: lastMonthStart,
      end: lastMonthEnd,
      type: 'last_month'
    };
  }

  /**
   * Calculate this month to date time frame
   * Returns from the 1st of current month to today
   * 
   * @returns {Object} Object with start and end dates
   */
  calculateThisMonthToDate() {
    const now = new Date();

    // Get the first day of the current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Set end date to now
    const monthEnd = new Date(now);

    console.log(`📅 [TimeFrameCalculation] This month to date: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);

    return {
      start: monthStart,
      end: monthEnd,
      type: 'this_month_to_date'
    };
  }

  calculateYearToDate() {
    const now = new Date();

    console.log(`📅 [TimeFrameCalculation] This year to date`);

    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: now,
      type: 'year_to_date'
    };
  }

  /**
   * Calculate since installation time frame
   * Returns from the earliest meter reading for the meter element to today
   * 
   * @param {Object} options - Options object
   * @param {number} [options.meterElementId] - Meter element ID
   * @param {number} [options.tenantId] - Tenant ID
   * @returns {Promise<Object>} Object with start and end dates
   * @throws {Error} If meter element ID or tenant ID is missing, or no readings found
   */
  async calculateSinceInstallation(options) {
    const { meterElementId, tenantId } = options;

    // Validate required parameters
    if (!meterElementId) {
      throw new Error('meterElementId is required for since_installation time frame');
    }
    if (!tenantId) {
      throw new Error('tenantId is required for since_installation time frame');
    }

    try {
      // Query the earliest meter reading for this meter element
      const query = `
        SELECT MIN(created_at) as earliest_reading
        FROM meter_reading
        WHERE meter_element_id = $1 AND tenant_id = $2
      `;

      const result = await db.query(query, [meterElementId, tenantId]);

      if (!result.rows || result.rows.length === 0) {
        throw new Error('No meter readings found for this meter element');
      }

      /** @type {any} */
      const row = result.rows[0];
      const earliestReading = row.earliest_reading;

      if (!earliestReading) {
        throw new Error('No meter readings found for this meter element');
      }

      const startDate = new Date(earliestReading);
      const endDate = new Date();

      console.log(`📅 [TimeFrameCalculation] Since installation: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      return {
        start: startDate,
        end: endDate,
        type: 'since_installation'
      };
    } catch (error) {
      const err = /** @type {Error} */ (error);
      console.error('❌ [TimeFrameCalculation] Error calculating since_installation:', err.message);
      throw error;
    }
  }

  /**
   * Validate custom date range
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @throws {Error} If dates are invalid
   */
  validateDateRange(startDate, endDate) {
    // Convert to Date objects if they're strings
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates are valid
    if (isNaN(start.getTime())) {
      throw new Error(`Invalid start date: ${startDate}`);
    }
    if (isNaN(end.getTime())) {
      throw new Error(`Invalid end date: ${endDate}`);
    }

    // Validate start date is before end date
    if (start >= end) {
      throw new Error('Start date must be before end date');
    }
  }

  /**
   * Format time frame for SQL queries
   * Converts Date objects to ISO strings suitable for PostgreSQL
   * 
   * @param {Object} timeFrame - Time frame object with start and end dates
   * @returns {Object} Formatted time frame with ISO string dates
   */
  formatForSQL(timeFrame) {
    return {
      start: timeFrame.start.toISOString(),
      end: timeFrame.end.toISOString(),
      type: timeFrame.type
    };
  }

  /**
   * Get time frame description for display
   * 
   * @param {string} timeFrameType - Type of time frame
   * @param {Object} timeFrame - Time frame object with start and end dates
   * @returns {string} Human-readable description
   */
  getTimeFrameDescription(timeFrameType, timeFrame) {
    const startDate = timeFrame.start.toLocaleDateString();
    const endDate = timeFrame.end.toLocaleDateString();

    switch (timeFrameType) {
      case 'last_month':
        return `Last Month (${startDate} to ${endDate})`;
      case 'this_month_to_date':
        return `This Month to Date (${startDate} to ${endDate})`;
      case 'since_installation':
        return `Since Installation (${startDate} to ${endDate})`;
      case 'custom':
        return `Custom Range (${startDate} to ${endDate})`;
      default:
        return `${startDate} to ${endDate}`;
    }
  }
}

// Export singleton instance
module.exports = new TimeFrameCalculationService();
