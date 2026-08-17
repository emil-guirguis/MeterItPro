/**
 * Frontend Password Validator Utility
 * Validates password strength and security requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordValidator {
  private static commonPatterns = [
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

  /**
   * Validate password strength
   * @param password - Password to validate
   * @param email - User email (to check if password contains email)
   * @param username - Username (to check if password contains username)
   * @returns { isValid: boolean, errors: string[] }
   */
  static validate(password: string, email: string = '', username: string = ''): PasswordValidationResult {
    const errors: string[] = [];

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
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    // Check for common patterns
    const lowerPassword = password.toLowerCase();
    if (this.commonPatterns.some((pattern) => lowerPassword.includes(pattern))) {
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
   * @param password - Password to score
   * @returns Strength score from 0 to 100
   */
  static getStrengthScore(password: string): number {
    if (!password) return 0;

    let score = 0;

    // Length scoring
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    // Character type scoring
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[!@#$%^&*]/.test(password)) score += 15;

    // Bonus for mixing character types
    const charTypes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[!@#$%^&*]/].filter((regex) =>
      regex.test(password)
    ).length;

    if (charTypes >= 3) score += 10;

    return Math.min(score, 100);
  }
}
