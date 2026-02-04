/**
 * Password Validator Service
 * Validates password strength and security requirements
 */

class PasswordValidator {
  constructor() {
    // Common weak passwords and patterns
    this.commonPatterns = [
      'password',
      'password123',
      '123456',
      'qwerty',
      'abc123',
      'letmein',
      'welcome',
      'monkey',
      '1234567890',
      'admin',
      'root',
    ];
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @param {string} email - User email (to check if password contains email)
   * @param {string} username - Username (to check if password contains username)
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate(password, email = '', username = '') {
    const errors = [];

    // Check if password is provided
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    // Check minimum length
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z)');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z)');
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number (0-9)');
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    // Check for common patterns (case-insensitive)
    const lowerPassword = password.toLowerCase();
    if (this.commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
      errors.push('Password is too common, please choose a stronger password');
    }

    // Check if password contains email
    if (email && lowerPassword.includes(email.toLowerCase())) {
      errors.push('Password cannot contain your email address');
    }

    // Check if password contains username
    if (username && lowerPassword.includes(username.toLowerCase())) {
      errors.push('Password cannot contain your username');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get password strength score (0-100)
   * @param {string} password - Password to score
   * @returns {number} Strength score 0-100
   */
  getStrengthScore(password) {
    if (!password || typeof password !== 'string') {
      return 0;
    }

    let score = 0;

    // Length scoring
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    // Character type scoring
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;

    // Bonus for mixing character types
    const charTypes = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    ].filter(Boolean).length;

    if (charTypes >= 3) score += 5;
    if (charTypes === 4) score += 5;

    return Math.min(100, score);
  }

  /**
   * Get password strength label
   * @param {number} score - Strength score
   * @returns {string} Strength label
   */
  getStrengthLabel(score) {
    if (score < 20) return 'Very Weak';
    if (score < 40) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Good';
    return 'Strong';
  }
}

module.exports = new PasswordValidator();
