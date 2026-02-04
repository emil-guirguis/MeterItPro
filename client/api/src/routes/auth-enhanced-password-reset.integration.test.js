// /**
//  * Integration Tests for Password Reset Flow
//  * Tests for POST /api/auth/forgot-password and POST /api/auth/reset-password
//  * 
//  * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14, 4.15, 4.16
//  */

// const request = require('supertest');
// const express = require('express');
// const authEnhancedRoutes = require('./auth-enhanced');
// const User = require('../models/UserWithSchema');
// const AuthLoggingService = require('../services/AuthLoggingService');
// const TokenService = require('../services/TokenService');
// const PasswordValidator = require('../services/PasswordValidator');
// const EmailService = require('../services/EmailService');
// const { authenticateToken } = require('../middleware/auth');
// const db = require('../config/database');

// // Mock dependencies
// jest.mock('../models/UserWithSchema');
// jest.mock('../services/AuthLoggingService');
// jest.mock('../services/TokenService');
// jest.mock('../services/PasswordValidator');
// jest.mock('../services/EmailService');
// jest.mock('../middleware/auth');
// jest.mock('../config/database');

// describe('Integration: Password Reset Flow', () => {
//   let app;
//   let mockUser;

//   beforeEach(() => {
//     // Create Express app with routes
//     app = express();
//     app.use(express.json());

//     // Reset all mocks FIRST
//     jest.clearAllMocks();

//     // Mock authenticateToken middleware AFTER clearing mocks
//     authenticateToken.mockImplementation((req, res, next) => {
//       req.user = { users_id: 1 };
//       next();
//     });

//     app.use('/api/auth', authEnhancedRoutes);

//     // Setup mock user
//     mockUser = {
//       users_id: 1,
//       email: 'test@example.com',
//       name: 'Test User',
//       passwordHash: '$2b$10$hashedpassword',
//       comparePassword: jest.fn(),
//       update: jest.fn(),
//     };
//   });

//   describe('Forgot Password Request', () => {
//     it('should accept forgot password request with valid email', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] }); // No previous requests
//       TokenService.generateResetToken.mockReturnValue({
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       });
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.message).toContain('If an account exists with this email');
//     });

//     it('should return generic message when email does not exist', async () => {
//       User.findByEmail.mockResolvedValue(null);
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'nonexistent@example.com',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       // Generic message for security
//       expect(response.body.message).toContain('If an account exists with this email');
//     });

//     it('should generate reset token with 24-hour expiration', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       TokenService.generateResetToken.mockReturnValue({
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       });
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com',
//         });

//       expect(TokenService.generateResetToken).toHaveBeenCalled();
//       expect(TokenService.storeResetToken).toHaveBeenCalledWith(
//         mockUser.users_id,
//         expect.any(String),
//         expect.any(Date)
//       );
//     });

//     it('should send reset email with token link', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       TokenService.generateResetToken.mockReturnValue({
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       });
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com',
//         });

//       expect(EmailService.sendEmail).toHaveBeenCalledWith(
//         expect.objectContaining({
//           to: 'test@example.com',
//           subject: expect.stringContaining('Password Reset'),
//           html: expect.stringContaining('test-token-123'),
//         })
//       );
//     });

//     it('should enforce rate limit of 3 requests per hour per email', async () => {
//       // Simulate 3 existing requests in the last hour
//       db.query.mockResolvedValue({ rows: [{ count: '3' }] });

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       // Should return generic message without revealing rate limit
//       expect(response.body.message).toContain('If an account exists with this email');
//       // Should not attempt to find user or send email
//       expect(User.findByEmail).not.toHaveBeenCalled();
//     });

//     it('should allow request when under rate limit', async () => {
//       // Simulate 2 existing requests (under limit of 3)
//       db.query.mockResolvedValue({ rows: [{ count: '2' }] });
//       User.findByEmail.mockResolvedValue(mockUser);
//       TokenService.generateResetToken.mockReturnValue({
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       });
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com',
//         });

//       expect(response.status).toBe(200);
//       expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
//       expect(EmailService.sendEmail).toHaveBeenCalled();
//     });

//     it('should log password reset request', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       TokenService.generateResetToken.mockReturnValue({
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       });
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com',
//         });

//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           userId: mockUser.users_id,
//           eventType: 'password_reset_requested',
//           status: 'success',
//         })
//       );
//     });
//   });

//   describe('Password Reset with Valid Token', () => {
//     it('should successfully reset password with valid token', async () => {
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         is_used: false,
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(true);
//       User.findById.mockResolvedValue(mockUser);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       User.hashPassword.mockResolvedValue('$2b$10$newhash');
//       mockUser.update.mockResolvedValue({});
//       TokenService.invalidateResetToken.mockResolvedValue({});
//       AuthLoggingService.logPasswordReset.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.message).toContain('Password reset successfully');

//       // Verify password was updated
//       expect(User.hashPassword).toHaveBeenCalledWith('NewPassword123!@#');
//       expect(mockUser.update).toHaveBeenCalledWith(
//         expect.objectContaining({
//           passwordHash: '$2b$10$newhash',
//           password_changed_at: expect.any(Date),
//         })
//       );

//       // Verify token was invalidated
//       expect(TokenService.invalidateResetToken).toHaveBeenCalledWith('valid-token');
//     });

//     it('should validate new password meets security requirements', async () => {
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         is_used: false,
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(true);
//       User.findById.mockResolvedValue(mockUser);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: false,
//         errors: ['Password must be at least 12 characters long'],
//       });
//       AuthLoggingService.logPasswordReset.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           newPassword: 'Short1!',
//           confirmPassword: 'Short1!',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Password does not meet security requirements');
//       expect(response.body.errors).toContain('Password must be at least 12 characters long');

//       // Verify password was not updated
//       expect(mockUser.update).not.toHaveBeenCalled();
//     });

//     it('should log successful password reset', async () => {
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         is_used: false,
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(true);
//       User.findById.mockResolvedValue(mockUser);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       User.hashPassword.mockResolvedValue('$2b$10$newhash');
//       mockUser.update.mockResolvedValue({});
//       TokenService.invalidateResetToken.mockResolvedValue({});
//       AuthLoggingService.logPasswordReset.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(AuthLoggingService.logPasswordReset).toHaveBeenCalledWith(1, true);
//     });
//   });

//   describe('Password Reset with Expired Token', () => {
//     it('should reject if token is expired', async () => {
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
//         is_used: false,
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(false);
//       AuthLoggingService.logPasswordReset.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'expired-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Reset link has expired or is invalid');

//       // Verify password was not updated
//       expect(mockUser.update).not.toHaveBeenCalled();

//       // Verify failure was logged
//       expect(AuthLoggingService.logPasswordReset).toHaveBeenCalledWith(
//         expect.any(Number),
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'invalid_token' }),
//         })
//       );
//     });

//     it('should offer to send new reset link when token is expired', async () => {
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() - 1000),
//         is_used: false,
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(false);
//       AuthLoggingService.logPasswordReset.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'expired-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Reset link has expired or is invalid');
//     });
//   });

//   describe('Password Reset with Invalid Token', () => {
//     it('should reject if token does not exist', async () => {
//       db.query.mockResolvedValue({ rows: [] }); // No token found

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'nonexistent-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Reset link has expired or is invalid');

//       // Verify password was not updated
//       expect(mockUser.update).not.toHaveBeenCalled();
//     });

//     it('should reject if token has already been used', async () => {
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         is_used: true, // Already used
//         used_at: new Date(),
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(false);
//       AuthLoggingService.logPasswordReset.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'used-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Reset link has expired or is invalid');

//       // Verify password was not updated
//       expect(mockUser.update).not.toHaveBeenCalled();
//     });
//   });

//   describe('Password Reset Error Handling', () => {
//     it('should return 404 if user not found', async () => {
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         is_used: false,
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(true);
//       User.findById.mockResolvedValue(null);

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(404);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('User not found');
//     });

//     it('should reject if passwords do not match', async () => {
//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'DifferentPassword123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Passwords do not match');
//     });

//     it('should handle database errors gracefully', async () => {
//       db.query.mockRejectedValue(new Error('Database connection failed'));

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Failed to reset password');
//     });

//     it('should handle password hashing errors gracefully', async () => {
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         is_used: false,
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(true);
//       User.findById.mockResolvedValue(mockUser);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       User.hashPassword.mockRejectedValue(new Error('Hashing failed'));

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Failed to reset password');
//     });
//   });

//   describe('Password Reset Input Validation', () => {
//     it('should validate required fields', async () => {
//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           // Missing newPassword and confirmPassword
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Validation failed');
//     });

//     it('should validate email format in forgot password', async () => {
//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'invalid-email',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Validation failed');
//     });

//     it('should normalize email address to lowercase', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       TokenService.generateResetToken.mockReturnValue({
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       });
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'TEST@EXAMPLE.COM',
//         });

//       // Email should be normalized to lowercase
//       expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
//     });
//   });

//   describe('Full Password Reset Flow', () => {
//     it('should complete full password reset flow from request to reset', async () => {
//       // Step 1: User requests password reset
//       User.findByEmail.mockResolvedValue(mockUser);
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       TokenService.generateResetToken.mockReturnValue({
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       });
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const forgotResponse = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com',
//         });

//       expect(forgotResponse.status).toBe(200);
//       expect(forgotResponse.body.success).toBe(true);

//       // Step 2: User clicks reset link and submits new password
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         is_used: false,
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(true);
//       User.findById.mockResolvedValue(mockUser);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       User.hashPassword.mockResolvedValue('$2b$10$newhash');
//       mockUser.update.mockResolvedValue({});
//       TokenService.invalidateResetToken.mockResolvedValue({});
//       AuthLoggingService.logPasswordReset.mockResolvedValue({});

//       const resetResponse = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'test-token-123',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(resetResponse.status).toBe(200);
//       expect(resetResponse.body.success).toBe(true);
//       expect(resetResponse.body.message).toContain('Password reset successfully');

//       // Verify token was invalidated
//       expect(TokenService.invalidateResetToken).toHaveBeenCalledWith('test-token-123');
//     });
//   });
// });
