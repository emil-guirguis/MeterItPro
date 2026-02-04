/**
 * Tests for Users Routes
 * Tests for admin password reset endpoint
 */

const request = require('supertest');
const express = require('express');
const User = require('../models/UserWithSchema');
const TokenService = require('../services/TokenService');
const EmailService = require('../services/EmailService');
const AuthLoggingService = require('../services/AuthLoggingService');

// Mock dependencies
jest.mock('../models/UserWithSchema');
jest.mock('../services/TokenService');
jest.mock('../services/EmailService');
jest.mock('../services/AuthLoggingService');

// Mock requirePermission before importing routes
jest.mock('../middleware/auth', () => ({
  requirePermission: jest.fn(() => (req, res, next) => {
    req.user = { users_id: 1, tenant_id: 1 };
    next();
  }),
}));

const usersRoutes = require('./users');

describe('Users Routes - Admin Reset Password', () => {
  let app;
  let mockTargetUser;

  beforeEach(() => {
    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/users', usersRoutes);

    // Setup mock target user
    mockTargetUser = {
      users_id: 2,
      email: 'user@example.com',
      tenant_id: 1,
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /:id/reset-password', () => {
    it('should validate user ID format', async () => {
      const response = await request(app)
        .post('/api/users/invalid/reset-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid user ID is required');
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/users/999/reset-password')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should generate reset token with 24-hour expiration', async () => {
      const mockToken = {
        token: 'test-token-123',
        token_hash: '$2b$10$hashedtoken',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      User.findById.mockResolvedValue(mockTargetUser);
      TokenService.generateResetToken.mockReturnValue(mockToken);
      TokenService.storeResetToken.mockResolvedValue({});
      EmailService.sendEmail.mockResolvedValue({ success: true });
      AuthLoggingService.logEvent.mockResolvedValue({});

      const response = await request(app)
        .post('/api/users/2/reset-password')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(TokenService.generateResetToken).toHaveBeenCalled();
      expect(TokenService.storeResetToken).toHaveBeenCalledWith(
        2,
        mockToken.token_hash,
        mockToken.expires_at
      );
    });

    it('should send email with reset link', async () => {
      const mockToken = {
        token: 'test-token-123',
        token_hash: '$2b$10$hashedtoken',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      User.findById.mockResolvedValue(mockTargetUser);
      TokenService.generateResetToken.mockReturnValue(mockToken);
      TokenService.storeResetToken.mockResolvedValue({});
      EmailService.sendEmail.mockResolvedValue({ success: true });
      AuthLoggingService.logEvent.mockResolvedValue({});

      const response = await request(app)
        .post('/api/users/2/reset-password')
        .send({});

      expect(response.status).toBe(200);
      expect(EmailService.sendEmail).toHaveBeenCalled();

      const emailCall = EmailService.sendEmail.mock.calls[0][0];
      expect(emailCall.to).toBe(mockTargetUser.email);
      expect(emailCall.subject).toContain('Password Reset');
      expect(emailCall.html).toContain('reset-password?token=test-token-123');
      expect(emailCall.html).toContain('24 hours');
    });

    it('should log admin password reset event', async () => {
      const mockToken = {
        token: 'test-token-123',
        token_hash: '$2b$10$hashedtoken',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      User.findById.mockResolvedValue(mockTargetUser);
      TokenService.generateResetToken.mockReturnValue(mockToken);
      TokenService.storeResetToken.mockResolvedValue({});
      EmailService.sendEmail.mockResolvedValue({ success: true });
      AuthLoggingService.logEvent.mockResolvedValue({});

      const response = await request(app)
        .post('/api/users/2/reset-password')
        .send({});

      expect(response.status).toBe(200);
      expect(AuthLoggingService.logEvent).toHaveBeenCalledWith({
        userId: 2,
        eventType: 'password_reset_admin',
        status: 'success',
        details: {
          admin_id: 1,
          email: mockTargetUser.email,
        },
      });
    });

    it('should return success message even if email fails', async () => {
      const mockToken = {
        token: 'test-token-123',
        token_hash: '$2b$10$hashedtoken',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      User.findById.mockResolvedValue(mockTargetUser);
      TokenService.generateResetToken.mockReturnValue(mockToken);
      TokenService.storeResetToken.mockResolvedValue({});
      EmailService.sendEmail.mockRejectedValue(new Error('Email service error'));
      AuthLoggingService.logEvent.mockResolvedValue({});

      const response = await request(app)
        .post('/api/users/2/reset-password')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset link has been sent');
    });

    it('should handle database errors gracefully', async () => {
      User.findById.mockResolvedValue(mockTargetUser);
      TokenService.generateResetToken.mockReturnValue({
        token: 'test-token-123',
        token_hash: '$2b$10$hashedtoken',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      TokenService.storeResetToken.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/users/2/reset-password')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to process admin password reset');
    });
  });
});
