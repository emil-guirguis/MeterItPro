// const PasswordValidator = require('./PasswordValidator');

// describe('PasswordValidator', () => {
//   describe('validate()', () => {
//     it('should reject passwords shorter than 12 characters', () => {
//       const result = PasswordValidator.validate('Short1!');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password must be at least 12 characters long');
//     });

//     it('should reject passwords without uppercase letters', () => {
//       const result = PasswordValidator.validate('lowercase123!');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password must contain at least one uppercase letter (A-Z)');
//     });

//     it('should reject passwords without lowercase letters', () => {
//       const result = PasswordValidator.validate('UPPERCASE123!');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password must contain at least one lowercase letter (a-z)');
//     });

//     it('should reject passwords without numbers', () => {
//       const result = PasswordValidator.validate('NoNumbers!');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password must contain at least one number (0-9)');
//     });

//     it('should reject passwords without special characters', () => {
//       const result = PasswordValidator.validate('NoSpecial123');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)');
//     });

//     it('should reject common patterns', () => {
//       const result = PasswordValidator.validate('Password123!');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password is too common, please choose a stronger password');
//     });

//     it('should reject passwords containing email', () => {
//       const result = PasswordValidator.validate('Myuser@example.com123!', 'user@example.com');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password cannot contain your email address');
//     });

//     it('should reject passwords containing username', () => {
//       const result = PasswordValidator.validate('JohnDoe123!', '', 'johndoe');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password cannot contain your username');
//     });

//     it('should accept valid passwords', () => {
//       const result = PasswordValidator.validate('ValidPass123!@#');
//       expect(result.isValid).toBe(true);
//       expect(result.errors).toHaveLength(0);
//     });

//     it('should accept passwords with various special characters', () => {
//       const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', '"', "'", '\\', '|', ',', '.', '<', '>', '/'];
      
//       specialChars.forEach(char => {
//         const password = `ValidPass123${char}`;
//         const result = PasswordValidator.validate(password);
//         expect(result.isValid).toBe(true);
//       });
//     });

//     it('should handle null/undefined password', () => {
//       const result1 = PasswordValidator.validate(null);
//       expect(result1.isValid).toBe(false);
//       expect(result1.errors).toContain('Password is required');

//       const result2 = PasswordValidator.validate(undefined);
//       expect(result2.isValid).toBe(false);
//       expect(result2.errors).toContain('Password is required');
//     });

//     it('should handle non-string password', () => {
//       const result = PasswordValidator.validate(123456);
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password is required');
//     });

//     it('should be case-insensitive for email matching', () => {
//       const result = PasswordValidator.validate('MyUSER@EXAMPLE.COM123!', 'user@example.com');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password cannot contain your email address');
//     });

//     it('should be case-insensitive for username matching', () => {
//       const result = PasswordValidator.validate('JOHNDOE123!', '', 'johndoe');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password cannot contain your username');
//     });

//     it('should be case-insensitive for common patterns', () => {
//       const result = PasswordValidator.validate('PASSWORD123!');
//       expect(result.isValid).toBe(false);
//       expect(result.errors).toContain('Password is too common, please choose a stronger password');
//     });
//   });

//   describe('getStrengthScore()', () => {
//     it('should return 0 for null/undefined password', () => {
//       expect(PasswordValidator.getStrengthScore(null)).toBe(0);
//       expect(PasswordValidator.getStrengthScore(undefined)).toBe(0);
//     });

//     it('should return 0 for non-string password', () => {
//       expect(PasswordValidator.getStrengthScore(123456)).toBe(0);
//     });

//     it('should return low score for weak passwords', () => {
//       const score = PasswordValidator.getStrengthScore('weak');
//       expect(score).toBeLessThan(30);
//     });

//     it('should return higher score for longer passwords', () => {
//       const score12 = PasswordValidator.getStrengthScore('ValidPass123!');
//       const score20 = PasswordValidator.getStrengthScore('ValidPass123!@#$%^&*');
//       expect(score20).toBeGreaterThan(score12);
//     });

//     it('should return higher score for passwords with all character types', () => {
//       const score = PasswordValidator.getStrengthScore('ValidPass123!@#');
//       expect(score).toBeGreaterThan(50);
//     });

//     it('should cap score at 100', () => {
//       const score = PasswordValidator.getStrengthScore('VeryLongValidPassword123!@#$%^&*()_+-=[]{}');
//       expect(score).toBeLessThanOrEqual(100);
//     });

//     it('should give bonus for mixing character types', () => {
//       const scoreWithMixedTypes = PasswordValidator.getStrengthScore('ValidPass123!');
//       const scoreWithoutSpecial = PasswordValidator.getStrengthScore('ValidPass123');
//       expect(scoreWithMixedTypes).toBeGreaterThan(scoreWithoutSpecial);
//     });

//     it('should score passwords with only lowercase lower', () => {
//       const score = PasswordValidator.getStrengthScore('validpassword123');
//       expect(score).toBeLessThanOrEqual(50);
//     });

//     it('should score passwords with only uppercase lower', () => {
//       const score = PasswordValidator.getStrengthScore('VALIDPASSWORD123');
//       expect(score).toBeLessThanOrEqual(50);
//     });

//     it('should score passwords with only numbers lower', () => {
//       const score = PasswordValidator.getStrengthScore('123456789012');
//       expect(score).toBeLessThan(50);
//     });

//     it('should score passwords with only special characters lower', () => {
//       const score = PasswordValidator.getStrengthScore('!@#$%^&*()_+-=');
//       expect(score).toBeLessThan(50);
//     });
//   });

//   describe('getStrengthLabel()', () => {
//     it('should return "Very Weak" for score < 20', () => {
//       expect(PasswordValidator.getStrengthLabel(10)).toBe('Very Weak');
//     });

//     it('should return "Weak" for score 20-39', () => {
//       expect(PasswordValidator.getStrengthLabel(30)).toBe('Weak');
//     });

//     it('should return "Fair" for score 40-59', () => {
//       expect(PasswordValidator.getStrengthLabel(50)).toBe('Fair');
//     });

//     it('should return "Good" for score 60-79', () => {
//       expect(PasswordValidator.getStrengthLabel(70)).toBe('Good');
//     });

//     it('should return "Strong" for score >= 80', () => {
//       expect(PasswordValidator.getStrengthLabel(90)).toBe('Strong');
//     });
//   });
// });
