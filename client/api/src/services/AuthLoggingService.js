/**
 * Authentication Logging Service
 * Logs authentication events for audit trail and security monitoring
 */

const db = require('../config/database');

class AuthLoggingService {
  /**
   * Log authentication event
   * @param {Object} options - Logging options
   * @param {number} [options.userId] - User ID (optional, can be null for user_not_found events)
   * @param {string} options.eventType - Event type (login, password_change, password_reset, 2fa_enable, 2fa_disable, failed_login)
   * @param {string} options.status - Status (success, failed)
   * @param {string} [options.ipAddress] - IP address
   * @param {string} [options.userAgent] - User agent
   * @param {Object} [options.details] - Additional details
   * @returns {Promise<Object>} Logged event record
   */
  static async logEvent({
    userId,
    eventType,
    status,
    ipAddress,
    userAgent,
    details
  }) {
    try {
      // Skip logging if userId is null/undefined and it's not a user_not_found event
      // For user_not_found events, we can't log userId since the user doesn't exist
      if (!userId && eventType !== 'login') {
        console.warn('[AUTH LOG] Skipping log event - userId is required for', eventType);
        return null;
      }

      const result = await db.query(
        'INSERT INTO auth_logs (user_id, event_type, status, ip_address, user_agent, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING auth_logs_id, user_id, event_type, status, created_at',
        [
          userId || null,  // Explicitly pass null if userId is undefined
          eventType,
          status,
          ipAddress,
          userAgent,
          details ? JSON.stringify(details) : null
        ]
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to log event');
      }

      console.log(`[AUTH LOG] ${eventType} - ${status} - User: ${userId || 'unknown'}`);
      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[AUTH LOG] Error logging event:', errorMessage);
      // Don't throw - logging failures shouldn't break authentication
      return null;
    }
  }

  /**
   * Log login attempt
   * @param {number} userId - User ID
   * @param {boolean} success - Whether login was successful
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Logged event record
   */
  static async logLoginAttempt(userId, success, options = {}) {
    return this.logEvent({
      userId,
      eventType: 'login',
      status: success ? 'success' : 'failed',
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: options.details
    });
  }

  /**
   * Log password change
   * @param {number} userId - User ID
   * @param {boolean} success - Whether password change was successful
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Logged event record
   */
  static async logPasswordChange(userId, success, options = {}) {
    return this.logEvent({
      userId,
      eventType: 'password_change',
      status: success ? 'success' : 'failed',
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: options.details
    });
  }

  /**
   * Log password reset
   * @param {number} userId - User ID
   * @param {boolean} success - Whether password reset was successful
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Logged event record
   */
  static async logPasswordReset(userId, success, options = {}) {
    return this.logEvent({
      userId,
      eventType: 'password_reset',
      status: success ? 'success' : 'failed',
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: options.details
    });
  }

  /**
   * Log 2FA enable
   * @param {number} userId - User ID
   * @param {string} methodType - 2FA method type
   * @param {boolean} success - Whether 2FA enable was successful
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Logged event record
   */
  static async log2FAEnable(userId, methodType, success, options = {}) {
    return this.logEvent({
      userId,
      eventType: '2fa_enable',
      status: success ? 'success' : 'failed',
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: { method_type: methodType, ...options.details }
    });
  }

  /**
   * Log 2FA disable
   * @param {number} userId - User ID
   * @param {string} methodType - 2FA method type
   * @param {boolean} success - Whether 2FA disable was successful
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Logged event record
   */
  static async log2FADisable(userId, methodType, success, options = {}) {
    return this.logEvent({
      userId,
      eventType: '2fa_disable',
      status: success ? 'success' : 'failed',
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: { method_type: methodType, ...options.details }
    });
  }

  /**
   * Get login history for user
   * @param {number} userId - User ID
   * @param {number} [limit=50] - Number of records to return
   * @returns {Promise<Array>} Array of login events
   */
  static async getLoginHistory(userId, limit = 50) {
    try {
      const result = await db.query(
        `SELECT auth_logs_id, event_type, status, ip_address, user_agent, details, created_at 
         FROM auth_logs 
         WHERE user_id = $1 AND event_type = 'login'
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows || [];
    } catch (error) {
      console.error('[AUTH LOG] Error getting login history:', error);
      return [];
    }
  }

  // /**
  //  * Get authentication events for user
  //  * @param {number} userId - User ID
  //  * @param {string} [eventType] - Filter by event type
  //  * @param {number} [limit=50] - Number of records to return
  //  * @returns {Promise<Array>} Array of auth events
  //  */
  // static async getAuthEvents(userId, eventType, limit = 50) {
  //   try {
  //     let query = `SELECT auth_logs_id, event_type, status, ip_address, user_agent, details, created_at 
  //                  FROM auth_logs 
  //                  WHERE user_id = $1`;
  //     const params = [userId];
  //     let paramIndex = 2;

  //     if (eventType) {
  //       query += ` AND event_type = $${paramIndex}`;
  //       params.push(eventType);
  //       paramIndex++;
  //     }

  //     query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
  //     params.push(limit);

  //     const result = await db.query(query, params);
  //     return result.rows || [];
  //   } catch (error) {
  //     console.error('[AUTH LOG] Error getting auth events:', error);
  //     return [];
  //   }
  // }

  // /**
  //  * Get failed login attempts for user
  //  * @param {number} userId - User ID
  //  * @param {number} [minutes=60] - Time window in minutes
  //  * @returns {Promise<number>} Number of failed attempts
  //  */
  // static async getFailedLoginAttempts(userId, minutes = 60) {
  //   try {
  //     const result = await db.query(
  //       `SELECT COUNT(*) as count 
  //        FROM auth_logs 
  //        WHERE user_id = $1 
  //        AND event_type = 'login'
  //        AND status = 'failed'
  //        AND created_at > CURRENT_TIMESTAMP - INTERVAL '${minutes} minutes'`,
  //       [userId]
  //     );

  //     const count = result.rows && result.rows.length > 0 ? parseInt(result.rows[0].count, 10) : 0;
  //     return count;
  //   } catch (error) {
  //     console.error('[AUTH LOG] Error getting failed login attempts:', error);
  //     return 0;
  //   }
  // }

  // /**
  //  * Clean up old auth logs
  //  * @param {number} [daysOld=90] - Delete logs older than this many days
  //  * @returns {Promise<number>} Number of logs deleted
  //  */
  // static async cleanupOldLogs(daysOld = 90) {
  //   try {
  //     const result = await db.query(
  //       `DELETE FROM auth_logs 
  //        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'`
  //     );

  //     const rowCount = result.rowCount || 0;
  //     console.log('[AUTH LOG] Cleaned up', rowCount, 'old auth logs');
  //     return rowCount;
  //   } catch (error) {
  //     console.error('[AUTH LOG] Error cleaning up old logs:', error);
  //     return 0;
  //   }
  // }
}

module.exports = AuthLoggingService;
