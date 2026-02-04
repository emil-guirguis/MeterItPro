/**
 * Two-Factor Authentication Service
 * Manages TOTP, Email OTP, and SMS OTP generation and validation
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

class TwoFactorService {
  /**
   * Generate TOTP secret and QR code
   * @param {string} userEmail - User's email for QR code label
   * @returns {Promise<Object>} { secret, qr_code }
   */
  async generateTOTPSecret(userEmail) {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `MeterIt Pro (${userEmail})`,
        issuer: 'MeterIt Pro',
        length: 32,
      });

      // Generate QR code
      const qr_code = await QRCode.toDataURL(secret.otpauth_url);

      return {
        secret: secret.base32,
        qr_code,
        manual_entry_key: secret.base32,
      };
    } catch (error) {
      console.error('Error generating TOTP secret:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP code
   * @param {string} secret - TOTP secret (base32)
   * @param {string} code - 6-digit code from authenticator app
   * @returns {boolean} True if code is valid
   */
  verifyTOTPCode(secret, code) {
    try {
      // Verify with 1-step window (30 seconds before and after)
      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code,
        window: 1,
      });

      return isValid;
    } catch (error) {
      console.error('Error verifying TOTP code:', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   * @param {number} count - Number of codes to generate (default 10)
   * @returns {Array<Object>} Array of { code, code_hash }
   */
  generateBackupCodes(count = 10) {
    const codes = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const code_hash = bcrypt.hashSync(code, 10);

      codes.push({
        code,
        code_hash,
      });
    }

    return codes;
  }

  /**
   * Store backup codes in database
   * @param {number} user_id - User ID
   * @param {Array<Object>} codes - Array of { code, code_hash }
   * @returns {Promise<void>}
   */
  async storeBackupCodes(user_id, codes) {
    try {
      // Delete existing backup codes for this user
      await db.query(
        'DELETE FROM user_2fa_backup_codes WHERE user_id = $1',
        [user_id]
      );

      // Insert new backup codes
      for (const { code_hash } of codes) {
        await db.query(
          `INSERT INTO user_2fa_backup_codes (user_id, code_hash, is_used, created_at)
           VALUES ($1, $2, false, NOW())`,
          [user_id, code_hash]
        );
      }
    } catch (error) {
      console.error('Error storing backup codes:', error);
      throw error;
    }
  }

  /**
   * Verify backup code
   * @param {number} user_id - User ID
   * @param {string} code - Backup code to verify
   * @returns {Promise<boolean>} True if code is valid and unused
   */
  async verifyBackupCode(user_id, code) {
    try {
      // Find unused backup codes for this user
      const result = await db.query(
        `SELECT id, code_hash FROM user_2fa_backup_codes
         WHERE user_id = $1 AND is_used = false
         LIMIT 10`,
        [user_id]
      );

      if (result.rows.length === 0) {
        console.log('No unused backup codes found for user:', user_id);
        return false;
      }

      // Check each code
      for (const row of result.rows) {
        const backupCodeRow = /** @type {{id: number, code_hash: string}} */ (/** @type {unknown} */ (row));
        const isValid = bcrypt.compareSync(code, backupCodeRow.code_hash);
        if (isValid) {
          // Mark code as used
          await db.query(
            `UPDATE user_2fa_backup_codes
             SET is_used = true, used_at = NOW()
             WHERE id = $1`,
            [backupCodeRow.id]
          );
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  }

  /**
   * Generate Email OTP code
   * @returns {string} 6-digit code
   */
  generateEmailOTP() {
    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  /**
   * Store Email OTP in database
   * @param {number} user_id - User ID
   * @param {string} code - OTP code
   * @param {number} expiresInMinutes - Expiration time in minutes (default 5)
   * @returns {Promise<void>}
   */
  async storeEmailOTP(user_id, code, expiresInMinutes = 5) {
    try {
      const expires_at = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      const code_hash = bcrypt.hashSync(code, 10);

      // Delete existing OTP for this user
      await db.query(
        'DELETE FROM email_otp_codes WHERE user_id = $1',
        [user_id]
      );

      // Store new OTP
      await db.query(
        `INSERT INTO email_otp_codes (user_id, code_hash, expires_at, attempts, created_at)
         VALUES ($1, $2, $3, 0, NOW())`,
        [user_id, code_hash, expires_at]
      );
    } catch (error) {
      console.error('Error storing email OTP:', error);
      throw error;
    }
  }

  /**
   * Verify Email OTP code
   * @param {number} user_id - User ID
   * @param {string} code - OTP code to verify
   * @returns {Promise<Object>} { isValid, attemptsRemaining, isLocked }
   */
  async verifyEmailOTP(user_id, code) {
    try {
      // Get OTP record
      const result = await db.query(
        `SELECT id, code_hash, expires_at, attempts FROM email_otp_codes
         WHERE user_id = $1`,
        [user_id]
      );

      if (result.rows.length === 0) {
        return { isValid: false, attemptsRemaining: 0, isLocked: false };
      }

      /** @type {any} */
      const otpRecord = result.rows[0];
      const id = otpRecord.id;
      const code_hash = otpRecord.code_hash;
      const expires_at = otpRecord.expires_at;
      const attempts = otpRecord.attempts;

      // Check if locked (3 failed attempts)
      if (attempts >= 3) {
        return { isValid: false, attemptsRemaining: 0, isLocked: true };
      }

      // Check if expired
      if (new Date() > new Date(expires_at)) {
        return { isValid: false, attemptsRemaining: 0, isLocked: false };
      }

      // Verify code
      const isValid = bcrypt.compareSync(code, code_hash);

      if (isValid) {
        // Delete OTP on successful verification
        await db.query(
          'DELETE FROM email_otp_codes WHERE id = $1',
          [id]
        );
        return { isValid: true, attemptsRemaining: 3, isLocked: false };
      } else {
        // Increment attempts
        const newAttempts = attempts + 1;
        await db.query(
          'UPDATE email_otp_codes SET attempts = $1 WHERE id = $2',
          [newAttempts, id]
        );

        const attemptsRemaining = Math.max(0, 3 - newAttempts);
        const isLocked = newAttempts >= 3;

        return { isValid: false, attemptsRemaining, isLocked };
      }
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      return { isValid: false, attemptsRemaining: 0, isLocked: false };
    }
  }

  /**
   * Generate SMS OTP code
   * @returns {string} 6-digit code
   */
  generateSMSOTP() {
    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  /**
   * Store SMS OTP in database
   * @param {number} user_id - User ID
   * @param {string} code - OTP code
   * @param {number} expiresInMinutes - Expiration time in minutes (default 5)
   * @returns {Promise<void>}
   */
  async storeSMSOTP(user_id, code, expiresInMinutes = 5) {
    try {
      const expires_at = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      const code_hash = bcrypt.hashSync(code, 10);

      // Delete existing OTP for this user
      await db.query(
        'DELETE FROM sms_otp_codes WHERE user_id = $1',
        [user_id]
      );

      // Store new OTP
      await db.query(
        `INSERT INTO sms_otp_codes (user_id, code_hash, expires_at, attempts, created_at)
         VALUES ($1, $2, $3, 0, NOW())`,
        [user_id, code_hash, expires_at]
      );
    } catch (error) {
      console.error('Error storing SMS OTP:', error);
      throw error;
    }
  }

  /**
   * Verify SMS OTP code
   * @param {number} user_id - User ID
   * @param {string} code - OTP code to verify
   * @returns {Promise<Object>} { isValid, attemptsRemaining, isLocked }
   */
  async verifySMSOTP(user_id, code) {
    try {
      // Get OTP record
      const result = await db.query(
        `SELECT id, code_hash, expires_at, attempts FROM sms_otp_codes
         WHERE user_id = $1`,
        [user_id]
      );

      if (result.rows.length === 0) {
        return { isValid: false, attemptsRemaining: 0, isLocked: false };
      }

      /** @type {any} */
      const otpRecord = result.rows[0];
      const id = otpRecord.id;
      const code_hash = otpRecord.code_hash;
      const expires_at = otpRecord.expires_at;
      const attempts = otpRecord.attempts;

      // Check if locked (3 failed attempts)
      if (attempts >= 3) {
        return { isValid: false, attemptsRemaining: 0, isLocked: true };
      }

      // Check if expired
      if (new Date() > new Date(expires_at)) {
        return { isValid: false, attemptsRemaining: 0, isLocked: false };
      }

      // Verify code
      const isValid = bcrypt.compareSync(code, code_hash);

      if (isValid) {
        // Delete OTP on successful verification
        await db.query(
          'DELETE FROM sms_otp_codes WHERE id = $1',
          [id]
        );
        return { isValid: true, attemptsRemaining: 3, isLocked: false };
      } else {
        // Increment attempts
        const newAttempts = attempts + 1;
        await db.query(
          'UPDATE sms_otp_codes SET attempts = $1 WHERE id = $2',
          [newAttempts, id]
        );

        const attemptsRemaining = Math.max(0, 3 - newAttempts);
        const isLocked = newAttempts >= 3;

        return { isValid: false, attemptsRemaining, isLocked };
      }
    } catch (error) {
      console.error('Error verifying SMS OTP:', error);
      return { isValid: false, attemptsRemaining: 0, isLocked: false };
    }
  }
}

module.exports = new TwoFactorService();
