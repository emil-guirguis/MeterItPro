// /**
//  * Tests for Enhanced Authentication Routes
//  * Tests for changePassword and resetPassword endpoints
//  */

// const request = require('supertest');
// const express = require('express');
// const jwt = require('jsonwebtoken');
// const { authenticateToken } = require('../middleware/auth');
// const authEnhancedRoutes = require('./auth-enhanced');
// const User = require('../models/UserWithSchema');
// const AuthLoggingService = require('../services/AuthLoggingService');
// const PasswordValidator = require('../services/PasswordValidator');
// const TokenService = require('../services/TokenService');
// const TwoFactorService = require('../services/TwoFactorService');
// const PermissionsService = require('../services/PermissionsService');
// const db = require('../config/database');

// // Mock dependencies
// jest.mock('../models/UserWithSchema');
// jest.mock('../services/AuthLoggingService');
// jest.mock('../services/PasswordValidator');
// jest.mock('../services/TokenService');
// jest.mock('../services/TwoFactorService');
// jest.mock('../services/PermissionsService');
// jest.mock('../middleware/auth');
// jest.mock('../config/database');

// describe('Auth Enhanced Routes - login', () => {
//   let app;
//   let mockUser;

//   beforeEach(() => {
//     // Create Express app with routes
//     app = express();
//     app.use(express.json());
//     app.use('/api/auth', authEnhancedRoutes);

//     // Setup mock user
//     mockUser = {
//       users_id: 1,
//       email: 'test@example.com',
//       name: 'Test User',
//       role: 'viewer',
//       tenant_id: 1,
//       active: true,
//       locked_until: null,
//       failed_login_attempts: 0,
//       comparePassword: jest.fn(),
//       update: jest.fn(),
//     };

//     // Mock PermissionsService
//     PermissionsService.getPermissionsByRole.mockReturnValue({
//       dashboard: { view: true },
//       users: { view: true },
//     });

//     // Mock User.findById to return mockUser by default
//     User.findById.mockResolvedValue(mockUser);

//     // Reset all mocks
//     jest.clearAllMocks();

//     // Set JWT_SECRET for token generation
//     process.env.JWT_SECRET = 'test-secret';
//   });

//   describe('POST /login', () => {
//     it('should validate required fields', async () => {
//       const response = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           // Missing password
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Validation failed');
//     });

//     it('should reject if user not found', async () => {
//       User.findByEmail.mockResolvedValue(null);
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'nonexistent@example.com',
//           password: 'Password123!',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Invalid email or password');
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'failed',
//           details: expect.objectContaining({ reason: 'user_not_found' }),
//         })
//       );
//     });

//     it('should reject if account is locked', async () => {
//       const lockedUser = {
//         ...mockUser,
//         locked_until: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
//       };

//       User.findByEmail.mockResolvedValue(lockedUser);
//       User.findById.mockResolvedValue(lockedUser);
//       lockedUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [] }); // No 2FA methods
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'Password123!',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Account is locked');
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'failed',
//           details: expect.objectContaining({ reason: 'account_locked' }),
//         })
//       );
//     });

//     it('should reject if password is invalid', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(false);
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'WrongPassword123!',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Invalid email or password');
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'failed',
//           details: expect.objectContaining({ reason: 'invalid_password' }),
//         })
//       );
//     });

//     it('should reject if user is inactive', async () => {
//       const inactiveUser = { ...mockUser, active: false };
//       User.findByEmail.mockResolvedValue(inactiveUser);
//       inactiveUser.comparePassword.mockResolvedValue(true);
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'Password123!',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Account is inactive');
//     });

//     it('should return 2FA challenge if 2FA is enabled', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] }); // 2FA enabled
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'Password123!',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.requires_2fa).toBe(true);
//       expect(response.body.session_token).toBeDefined();
//       expect(response.body.available_methods).toContain('totp');
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'pending_2fa',
//           details: expect.objectContaining({ reason: '2fa_required' }),
//         })
//       );
//     });

//     it('should create full session if 2FA is not enabled', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [] }); // No 2FA methods
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'Password123!',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.requires_2fa).toBeUndefined();
//       expect(response.body.data.token).toBeDefined();
//       expect(response.body.data.user.users_id).toBe(1);
//       expect(response.body.data.user.email).toBe('test@example.com');
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'success',
//           details: expect.objectContaining({ method: 'password' }),
//         })
//       );
//     });

//     it('should handle database errors gracefully', async () => {
//       User.findByEmail.mockRejectedValue(new Error('Database connection failed'));

//       const response = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'Password123!',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Login failed');
//     });
//   });

//   describe('POST /verify-2fa', () => {
//     it('should validate required fields', async () => {
//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: 'token',
//           // Missing code and method
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Validation failed');
//     });

//     it('should reject if session token is invalid', async () => {
//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: 'invalid-token',
//           code: '123456',
//           method: 'totp',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Session token expired or invalid');
//     });

//     it('should reject if session token is not a 2FA session', async () => {
//       // Create a regular token (not 2FA session)
//       const regularToken = jwt.sign(
//         { userId: 1, tenant_id: 1, is2FASession: false },
//         process.env.JWT_SECRET
//       );

//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: regularToken,
//           code: '123456',
//           method: 'totp',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Invalid session token');
//     });

//     it('should return 404 if user not found', async () => {
//       const sessionToken = jwt.sign(
//         { userId: 1, tenant_id: 1, is2FASession: true },
//         process.env.JWT_SECRET
//       );

//       User.findById.mockResolvedValue(null);

//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'totp',
//         });

//       expect(response.status).toBe(404);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('User not found');
//     });

//     it('should verify TOTP code successfully', async () => {
//       const sessionToken = jwt.sign(
//         { userId: 1, tenant_id: 1, is2FASession: true },
//         process.env.JWT_SECRET
//       );

//       User.findById.mockResolvedValue(mockUser);
//       db.query.mockResolvedValue({ rows: [{ secret_key: 'test-secret' }] });
//       TwoFactorService.verifyTOTPCode.mockReturnValue(true);
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'totp',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data.token).toBeDefined();
//       expect(response.body.data.user.users_id).toBe(1);
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'success',
//           details: expect.objectContaining({ method: '2fa', verification_method: 'totp' }),
//         })
//       );
//     });

//     it('should reject invalid TOTP code', async () => {
//       const sessionToken = jwt.sign(
//         { userId: 1, tenant_id: 1, is2FASession: true },
//         process.env.JWT_SECRET
//       );

//       User.findById.mockResolvedValue(mockUser);
//       db.query.mockResolvedValue({ rows: [{ secret_key: 'test-secret' }] });
//       TwoFactorService.verifyTOTPCode.mockReturnValue(false);
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '000000',
//           method: 'totp',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Invalid 2FA code');
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'failed',
//           details: expect.objectContaining({ reason: 'invalid_2fa_code' }),
//         })
//       );
//     });

//     it('should verify email OTP successfully', async () => {
//       const sessionToken = jwt.sign(
//         { userId: 1, tenant_id: 1, is2FASession: true },
//         process.env.JWT_SECRET
//       );

//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyEmailOTP.mockResolvedValue({
//         isValid: true,
//         attemptsRemaining: 3,
//         isLocked: false,
//       });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'email_otp',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data.token).toBeDefined();
//     });

//     it('should reject email OTP with rate limiting', async () => {
//       const sessionToken = jwt.sign(
//         { userId: 1, tenant_id: 1, is2FASession: true },
//         process.env.JWT_SECRET
//       );

//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyEmailOTP.mockResolvedValue({
//         isValid: false,
//         attemptsRemaining: 0,
//         isLocked: true,
//       });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '000000',
//           method: 'email_otp',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.details.is_locked).toBe(true);
//     });

//     it('should verify backup code successfully', async () => {
//       const sessionToken = jwt.sign(
//         { userId: 1, tenant_id: 1, is2FASession: true },
//         process.env.JWT_SECRET
//       );

//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyBackupCode.mockResolvedValue(true);
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: 'BACKUP123456',
//           method: 'backup_code',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data.token).toBeDefined();
//     });

//     it('should handle database errors gracefully', async () => {
//       const sessionToken = jwt.sign(
//         { userId: 1, tenant_id: 1, is2FASession: true },
//         process.env.JWT_SECRET
//       );

//       User.findById.mockRejectedValue(new Error('Database connection failed'));

//       const response = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'totp',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('2FA verification failed');
//     });
//   });
// });

// describe('Auth Enhanced Routes - changePassword', () => {
//   let app;
//   let mockUser;

//   beforeEach(() => {
//     // Create Express app with routes
//     app = express();
//     app.use(express.json());

//     // Mock authenticateToken middleware
//     authenticateToken.mockImplementation((req, res, next) => {
//       req.user = { users_id: 1 };
//       next();
//     });

//     // Setup mock user
//     mockUser = {
//       users_id: 1,
//       email: 'test@example.com',
//       passwordHash: '$2b$10$hashedpassword',
//       comparePassword: jest.fn(),
//       update: jest.fn(),
//     };

//     // Reset all mocks
//     jest.clearAllMocks();
//   });

//   describe('POST /change-password', () => {
//     beforeEach(() => {
//       app.use('/api/auth', authEnhancedRoutes);
//     });

//     it('should require authentication', async () => {
//       authenticateToken.mockImplementation((req, res, next) => {
//         res.status(401).json({ success: false, message: 'Unauthorized' });
//       });

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPass123!',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(401);
//     });

//     it('should validate required fields', async () => {
//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPass123!',
//           // Missing newPassword and confirmPassword
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Validation failed');
//     });

//     it('should reject if passwords do not match', async () => {
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPass123!',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'DifferentPass123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Passwords do not match');
//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(
//         1,
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'passwords_do_not_match' }),
//         })
//       );
//     });

//     it('should return 404 if user not found', async () => {
//       User.findById.mockResolvedValue(null);

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPass123!',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(404);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('User not found');
//     });

//     it('should reject if current password is incorrect', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(false);
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'WrongPassword123!',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Current password is incorrect');
//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(
//         1,
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'invalid_current_password' }),
//         })
//       );
//     });

//     it('should reject if new password does not meet security requirements', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: false,
//         errors: ['Password must be at least 12 characters long'],
//       });
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPass123!',
//           newPassword: 'Short1!',
//           confirmPassword: 'Short1!',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Password does not meet security requirements');
//       expect(response.body.errors).toContain('Password must be at least 12 characters long');
//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(
//         1,
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'invalid_password' }),
//         })
//       );
//     });

//     it('should reject if new password is same as current password', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword
//         .mockResolvedValueOnce(true) // First call: current password is correct
//         .mockResolvedValueOnce(true); // Second call: new password matches current
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPass123!',
//           newPassword: 'OldPass123!',
//           confirmPassword: 'OldPass123!',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('New password must be different from current password');
//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(
//         1,
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'same_as_current' }),
//         })
//       );
//     });

//     it('should successfully change password', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword
//         .mockResolvedValueOnce(true) // First call: current password is correct
//         .mockResolvedValueOnce(false); // Second call: new password is different
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       User.hashPassword.mockResolvedValue('$2b$10$newhash');
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPass123!',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.message).toContain('Password changed successfully');
//       expect(User.hashPassword).toHaveBeenCalledWith('NewPass123!@#');
//       expect(mockUser.update).toHaveBeenCalledWith(
//         expect.objectContaining({
//           passwordHash: '$2b$10$newhash',
//           password_changed_at: expect.any(Date),
//         })
//       );
//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(1, true);
//     });

//     it('should handle database errors gracefully', async () => {
//       User.findById.mockRejectedValue(new Error('Database connection failed'));

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPass123!',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Failed to change password');
//     });

//     it('should validate new password against user email', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: false,
//         errors: ['Password cannot contain your email address'],
//       });
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPass123!',
//           newPassword: 'test@example.com123!',
//           confirmPassword: 'test@example.com123!',
//         });

//       expect(response.status).toBe(400);
//       expect(PasswordValidator.validate).toHaveBeenCalledWith('test@example.com123!', 'test@example.com');
//     });
//   });
// });

// describe('Auth Enhanced Routes - resetPassword', () => {
//   let app;
//   let mockUser;

//   beforeEach(() => {
//     // Create Express app with routes
//     app = express();
//     app.use(express.json());
//     app.use('/api/auth', authEnhancedRoutes);

//     // Setup mock user
//     mockUser = {
//       users_id: 1,
//       email: 'test@example.com',
//       passwordHash: '$2b$10$hashedpassword',
//       comparePassword: jest.fn(),
//       update: jest.fn(),
//     };

//     // Reset all mocks
//     jest.clearAllMocks();
//   });

//   describe('POST /reset-password', () => {
//     it('should validate required fields', async () => {
//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'test-token',
//           // Missing newPassword and confirmPassword
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Validation failed');
//     });

//     it('should reject if passwords do not match', async () => {
//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'test-token',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'DifferentPass123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Passwords do not match');
//     });

//     it('should reject if token is invalid or expired', async () => {
//       db.query.mockResolvedValue({ rows: [] });

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'invalid-token',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Reset link has expired or is invalid');
//     });

//     it('should reject if token validation fails', async () => {
//       const mockTokenRecord = {
//         user_id: 1,
//         token_hash: '$2b$10$hashedtoken',
//         expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         is_used: false,
//       };

//       db.query.mockResolvedValue({ rows: [mockTokenRecord] });
//       TokenService.validateResetToken.mockResolvedValue(false);
//       AuthLoggingService.logPasswordReset.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'invalid-token',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Reset link has expired or is invalid');
//       expect(AuthLoggingService.logPasswordReset).toHaveBeenCalledWith(
//         1,
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'invalid_token' }),
//         })
//       );
//     });

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
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(404);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('User not found');
//     });

//     it('should reject if new password does not meet security requirements', async () => {
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
//       expect(AuthLoggingService.logPasswordReset).toHaveBeenCalledWith(
//         1,
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'invalid_password' }),
//         })
//       );
//     });

//     it('should successfully reset password', async () => {
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
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.message).toContain('Password reset successfully');
//       expect(User.hashPassword).toHaveBeenCalledWith('NewPass123!@#');
//       expect(mockUser.update).toHaveBeenCalledWith(
//         expect.objectContaining({
//           passwordHash: '$2b$10$newhash',
//           password_changed_at: expect.any(Date),
//         })
//       );
//       expect(TokenService.invalidateResetToken).toHaveBeenCalledWith(1);
//       expect(AuthLoggingService.logPasswordReset).toHaveBeenCalledWith(1, true);
//     });

//     it('should validate new password against user email', async () => {
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
//         errors: ['Password cannot contain your email address'],
//       });
//       AuthLoggingService.logPasswordReset.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           newPassword: 'test@example.com123!',
//           confirmPassword: 'test@example.com123!',
//         });

//       expect(response.status).toBe(400);
//       expect(PasswordValidator.validate).toHaveBeenCalledWith('test@example.com123!', 'test@example.com');
//     });

//     it('should handle database errors gracefully', async () => {
//       db.query.mockRejectedValue(new Error('Database connection failed'));

//       const response = await request(app)
//         .post('/api/auth/reset-password')
//         .send({
//           token: 'valid-token',
//           newPassword: 'NewPass123!@#',
//           confirmPassword: 'NewPass123!@#',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Failed to reset password');
//     });
//   });
// });
