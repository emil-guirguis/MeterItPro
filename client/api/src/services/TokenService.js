/**
 * Token Service
 * Generates and validates secure reset tokens
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

class TokenService {
  /**
   * Generate a secure reset token
   * @param {number} length - Token length in bytes (default 32)
   * @returns {Object} { token: string, token_hash: string, expires_at: Date }
   */
  generateResetToken(length = 32) {
    // Generate random bytes
    const token = crypto.randomBytes(length).toString('hex');
    
    // Hash the token for storage
    const token_hash = bcrypt.hashSync(token, 10);
    
    // Set expiration to 24 hours from now
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    return {
      token,
      token_hash,
      expires_at,
    };
  }

  /**
   * Store reset token in database
   * @param {number} user_id - User ID
   * @param {string} token_hash - Hashed token
   * @param {Date} expires_at - Expiration time
   * @returns {Promise<Object>} Stored token record
   */
  async storeResetToken(user_id, token_hash, expires_at) {
    try {
      // Invalidate any existing tokens for this user
      await db.query(
        'UPDATE password_reset_tokens SET is_used = true WHERE user_id = $1 AND is_used = false',
        [user_id]
      );

      // Store new token
      const result = await db.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, is_used, created_at)
         VALUES ($1, $2, $3, false, NOW())
         RETURNING id, user_id, expires_at, created_at`,
        [user_id, token_hash, expires_at]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error storing reset token:', error);
      throw error;
    }
  }

  /**
   * Validate reset token
   * @param {string} token - Plain text token
   * @param {number} user_id - User ID
   * @returns {Promise<boolean>} True if token is valid
   */
  async validateResetToken(token, user_id) {
    try {
      // Find token record
      const result = await db.query(
        `SELECT id, token_hash, expires_at, is_used
         FROM password_reset_tokens
         WHERE user_id = $1 AND is_used = false
         ORDER BY created_at DESC
         LIMIT 1`,
        [user_id]
      );

      if (result.rows.length === 0) {
        console.log('No valid reset token found for user:', user_id);
        return false;
      }

      const tokenRecord = result.rows[0];

      // Check if token is expired
      if (new Date() > new Date(tokenRecord.expires_at)) {
        console.log('Reset token expired for user:', user_id);
        return false;
      }

      // Verify token hash
      const isValid = bcrypt.compareSync(token, tokenRecord.token_hash);
      
      if (!isValid) {
        console.log('Reset token hash mismatch for user:', user_id);
      }

      return isValid;
    } catch (error) {
      console.error('Error validating reset token:', error);
      return false;
    }
  }

  /**
   * Invalidate reset token after use
   * @param {number} user_id - User ID
   * @returns {Promise<void>}
   */
  async invalidateResetToken(user_id) {
    try {
      await db.query(
        `UPDATE password_reset_tokens
         SET is_used = true, used_at = NOW()
         WHERE user_id = $1 AND is_used = false`,
        [user_id]
      );
    } catch (error) {
      console.error('Error invalidating reset token:', error);
      throw error;
    }
  }

  /**
   * Clean up expired tokens (should be run periodically)
   * @returns {Promise<number>} Number of deleted tokens
   */
  async cleanupExpiredTokens() {
    try {
      const result = await db.query(
        `DELETE FROM password_reset_tokens
         WHERE expires_at < NOW() OR (is_used = true AND used_at < NOW() - INTERVAL '7 days')`
      );

      console.log('Cleaned up', result.rowCount, 'expired tokens');
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }
}

module.exports = new TokenService();
