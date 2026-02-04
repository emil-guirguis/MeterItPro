// /**
//  * Tests for Enhanced Authentication Routes - forgotPassword endpoint
//  * Tests for POST /api/auth/forgot-password
//  */

// const request = require('supertest');
// const express = require('express');
// const authEnhancedRoutes = require('./auth-enhanced');
// const User = require('../models/UserWithSchema');
// const AuthLoggingService = require('../services/AuthLoggingService');
// const TokenService = require('../services/TokenService');
// const EmailService = require('../services/EmailService');
// const db = require('../config/database');

// // Mock dependencies
// jest.mock('../models/UserWithSchema');
// jest.mock('../services/AuthLoggingService');
// jest.mock('../services/TokenService');
// jest.mock('../services/EmailService');
// jest.mock('../config/database');

// describe('Auth Enhanced Routes - forgotPassword', () => {
//   let app;

//   beforeEach(() => {
//     // Create Express app with routes
//     app = express();
//     app.use(express.json());
//     app.use('/api/auth', authEnhancedRoutes);

//     // Reset all mocks
//     jest.clearAllMocks();
//   });

//   describe('POST /forgot-password', () => {
//     it('should validate email format', async () => {
//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'invalid-email'
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Validation failed');
//     });

//     it('should require email field', async () => {
//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({});

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Validation failed');
//     });

//     it('should return generic message when email does not exist', async () => {
//       User.findByEmail.mockResolvedValue(null);
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'nonexistent@example.com'
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.message).toContain('If an account exists with this email');
//     });

//     it('should generate and store reset token when user exists', async () => {
//       const mockUser = {
//         users_id: 1,
//         email: 'test@example.com',
//         name: 'Test User'
//       };

//       const mockToken = {
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
//       };

//       User.findByEmail.mockResolvedValue(mockUser);
//       TokenService.generateResetToken.mockReturnValue(mockToken);
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com'
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(TokenService.generateResetToken).toHaveBeenCalled();
//       expect(TokenService.storeResetToken).toHaveBeenCalledWith(
//         mockUser.users_id,
//         mockToken.token_hash,
//         mockToken.expires_at
//       );
//     });

//     it('should send reset email when user exists', async () => {
//       const mockUser = {
//         users_id: 1,
//         email: 'test@example.com',
//         name: 'Test User'
//       };

//       const mockToken = {
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
//       };

//       User.findByEmail.mockResolvedValue(mockUser);
//       TokenService.generateResetToken.mockReturnValue(mockToken);
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com'
//         });

//       expect(response.status).toBe(200);
//       expect(EmailService.sendEmail).toHaveBeenCalledWith(
//         expect.objectContaining({
//           to: mockUser.email,
//           subject: 'Password Reset Request',
//           html: expect.stringContaining('Password Reset Request')
//         })
//       );
//     });

//     it('should log password reset request when user exists', async () => {
//       const mockUser = {
//         users_id: 1,
//         email: 'test@example.com',
//         name: 'Test User'
//       };

//       const mockToken = {
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
//       };

//       User.findByEmail.mockResolvedValue(mockUser);
//       TokenService.generateResetToken.mockReturnValue(mockToken);
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com'
//         });

//       expect(response.status).toBe(200);
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           userId: mockUser.users_id,
//           eventType: 'password_reset_requested',
//           status: 'success',
//           details: { email: 'test@example.com' }
//         })
//       );
//     });

//     it('should enforce rate limit (3 per hour per email)', async () => {
//       // Simulate 3 existing requests in the last hour
//       db.query.mockResolvedValue({ rows: [{ count: '3' }] });

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com'
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       // Should return generic message without revealing rate limit
//       expect(response.body.message).toContain('If an account exists with this email');
//       // Should not attempt to find user or send email
//       expect(User.findByEmail).not.toHaveBeenCalled();
//     });

//     it('should allow request when under rate limit', async () => {
//       const mockUser = {
//         users_id: 1,
//         email: 'test@example.com',
//         name: 'Test User'
//       };

//       const mockToken = {
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
//       };

//       // Simulate 2 existing requests (under limit of 3)
//       db.query.mockResolvedValue({ rows: [{ count: '2' }] });
//       User.findByEmail.mockResolvedValue(mockUser);
//       TokenService.generateResetToken.mockReturnValue(mockToken);
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com'
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       // Should attempt to find user and send email
//       expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
//       expect(EmailService.sendEmail).toHaveBeenCalled();
//     });

//     it('should continue even if email sending fails', async () => {
//       const mockUser = {
//         users_id: 1,
//         email: 'test@example.com',
//         name: 'Test User'
//       };

//       const mockToken = {
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
//       };

//       User.findByEmail.mockResolvedValue(mockUser);
//       TokenService.generateResetToken.mockReturnValue(mockToken);
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockRejectedValue(new Error('Email service down'));
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com'
//         });

//       // Should still return success even if email fails
//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//     });

//     it('should continue even if logging fails', async () => {
//       const mockUser = {
//         users_id: 1,
//         email: 'test@example.com',
//         name: 'Test User'
//       };

//       const mockToken = {
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
//       };

//       User.findByEmail.mockResolvedValue(mockUser);
//       TokenService.generateResetToken.mockReturnValue(mockToken);
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       AuthLoggingService.logEvent.mockRejectedValue(new Error('Logging failed'));

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com'
//         });

//       // Should still return success even if logging fails
//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//     });

//     it('should handle database errors gracefully', async () => {
//       // When rate limit check fails, it allows the request to proceed
//       // Then User.findByEmail will fail
//       db.query.mockRejectedValue(new Error('Database connection failed'));
//       User.findByEmail.mockRejectedValue(new Error('Database connection failed'));

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com'
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Failed to process password reset request');
//     });

//     it('should normalize email address', async () => {
//       const mockUser = {
//         users_id: 1,
//         email: 'test@example.com',
//         name: 'Test User'
//       };

//       const mockToken = {
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
//       };

//       User.findByEmail.mockResolvedValue(mockUser);
//       TokenService.generateResetToken.mockReturnValue(mockToken);
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'TEST@EXAMPLE.COM'
//         });

//       expect(response.status).toBe(200);
//       // Email should be normalized to lowercase
//       expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
//     });

//     it('should include reset link in email', async () => {
//       const mockUser = {
//         users_id: 1,
//         email: 'test@example.com',
//         name: 'Test User'
//       };

//       const mockToken = {
//         token: 'test-token-123',
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
//       };

//       User.findByEmail.mockResolvedValue(mockUser);
//       TokenService.generateResetToken.mockReturnValue(mockToken);
//       TokenService.storeResetToken.mockResolvedValue({ id: 1 });
//       EmailService.sendEmail.mockResolvedValue({ success: true });
//       db.query.mockResolvedValue({ rows: [{ count: '0' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/forgot-password')
//         .send({
//           email: 'test@example.com'
//         });

//       expect(response.status).toBe(200);
//       const emailCall = EmailService.sendEmail.mock.calls[0][0];
//       expect(emailCall.html).toContain('reset-password?token=test-token-123');
//       expect(emailCall.html).toContain('24 hours');
//     });
//   });
// });
