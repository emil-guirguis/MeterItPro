// /**
//  * Integration Tests for Full Login Flow with 2FA
//  * Tests for POST /api/auth/login and POST /api/auth/verify-2fa
//  * 
//  * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10
//  */

// const request = require('supertest');
// const express = require('express');
// const jwt = require('jsonwebtoken');
// const authEnhancedRoutes = require('./auth-enhanced');
// const User = require('../models/UserWithSchema');
// const AuthLoggingService = require('../services/AuthLoggingService');
// const TwoFactorService = require('../services/TwoFactorService');
// const { authenticateToken } = require('../middleware/auth');
// const db = require('../config/database');

// // Mock dependencies
// jest.mock('../models/UserWithSchema');
// jest.mock('../services/AuthLoggingService');
// jest.mock('../services/TwoFactorService');
// jest.mock('../middleware/auth');
// jest.mock('../config/database');

// describe('Integration: Full Login Flow with 2FA', () => {
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
//       role: 'viewer',
//       tenant_id: 1,
//       active: true,
//       locked_until: null,
//       failed_login_attempts: 0,
//       comparePassword: jest.fn(),
//       update: jest.fn(),
//     };

//     // Set JWT_SECRET for token generation
//     process.env.JWT_SECRET = 'test-secret';
//   });

//   describe('Login with TOTP 2FA', () => {
//     it('should complete full login flow with valid TOTP code', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp', secret_key: 'test-secret' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       expect(loginResponse.status).toBe(200);
//       expect(loginResponse.body.success).toBe(true);
//       expect(loginResponse.body.requires_2fa).toBe(true);
//       expect(loginResponse.body.session_token).toBeDefined();
//       expect(loginResponse.body.available_methods).toContain('totp');

//       // Step 2: User verifies TOTP code
//       const sessionToken = loginResponse.body.session_token;
//       TwoFactorService.verifyTOTPCode.mockReturnValue(true);
//       mockUser.update.mockResolvedValue({});

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'totp',
//         });

//       expect(verify2FAResponse.status).toBe(200);
//       expect(verify2FAResponse.body.success).toBe(true);
//       expect(verify2FAResponse.body.data.token).toBeDefined();
//       expect(verify2FAResponse.body.data.user.users_id).toBe(1);
//       expect(verify2FAResponse.body.data.user.email).toBe('test@example.com');

//       // Verify logging was called for both steps
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'pending_2fa',
//         })
//       );
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'success',
//           details: expect.objectContaining({ verification_method: 'totp' }),
//         })
//       );
//     });

//     it('should reject login if TOTP code is invalid', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp', secret_key: 'test-secret' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       expect(loginResponse.status).toBe(200);
//       expect(loginResponse.body.requires_2fa).toBe(true);

//       // Step 2: User provides invalid TOTP code
//       const sessionToken = loginResponse.body.session_token;
//       TwoFactorService.verifyTOTPCode.mockReturnValue(false);

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '000000',
//           method: 'totp',
//         });

//       expect(verify2FAResponse.status).toBe(401);
//       expect(verify2FAResponse.body.success).toBe(false);
//       expect(verify2FAResponse.body.message).toContain('Invalid 2FA code');
//       expect(verify2FAResponse.body.data).toBeUndefined();
//     });

//     it('should expire 2FA session after 10 minutes', async () => {
//       // Create an expired session token
//       const expiredSessionToken = jwt.sign(
//         { userId: 1, tenant_id: 1, is2FASession: true },
//         process.env.JWT_SECRET,
//         { expiresIn: '-1s' } // Already expired
//       );

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: expiredSessionToken,
//           code: '123456',
//           method: 'totp',
//         });

//       expect(verify2FAResponse.status).toBe(401);
//       expect(verify2FAResponse.body.success).toBe(false);
//       expect(verify2FAResponse.body.message).toContain('Session token expired or invalid');
//     });
//   });

//   describe('Login with Email OTP 2FA', () => {
//     it('should complete full login flow with valid Email OTP code', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'email_otp' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       expect(loginResponse.status).toBe(200);
//       expect(loginResponse.body.requires_2fa).toBe(true);
//       expect(loginResponse.body.available_methods).toContain('email_otp');

//       // Step 2: User verifies Email OTP code
//       const sessionToken = loginResponse.body.session_token;
//       TwoFactorService.verifyEmailOTP.mockResolvedValue({
//         isValid: true,
//         attemptsRemaining: 3,
//         isLocked: false,
//       });
//       mockUser.update.mockResolvedValue({});

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'email_otp',
//         });

//       expect(verify2FAResponse.status).toBe(200);
//       expect(verify2FAResponse.body.success).toBe(true);
//       expect(verify2FAResponse.body.data.token).toBeDefined();
//       expect(verify2FAResponse.body.data.user.users_id).toBe(1);
//     });

//     it('should enforce rate limiting on Email OTP attempts', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'email_otp' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       const sessionToken = loginResponse.body.session_token;

//       // Step 2: User exceeds 3 failed attempts
//       TwoFactorService.verifyEmailOTP.mockResolvedValue({
//         isValid: false,
//         attemptsRemaining: 0,
//         isLocked: true,
//       });

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '000000',
//           method: 'email_otp',
//         });

//       expect(verify2FAResponse.status).toBe(401);
//       expect(verify2FAResponse.body.success).toBe(false);
//       expect(verify2FAResponse.body.details.is_locked).toBe(true);
//     });

//     it('should allow retry within rate limit', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'email_otp' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       const sessionToken = loginResponse.body.session_token;

//       // Step 2: First attempt fails
//       TwoFactorService.verifyEmailOTP.mockResolvedValueOnce({
//         isValid: false,
//         attemptsRemaining: 2,
//         isLocked: false,
//       });

//       const firstAttempt = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '000000',
//           method: 'email_otp',
//         });

//       expect(firstAttempt.status).toBe(401);
//       expect(firstAttempt.body.details.attempts_remaining).toBe(2);

//       // Step 3: Second attempt succeeds
//       TwoFactorService.verifyEmailOTP.mockResolvedValueOnce({
//         isValid: true,
//         attemptsRemaining: 2,
//         isLocked: false,
//       });
//       mockUser.update.mockResolvedValue({});

//       const secondAttempt = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'email_otp',
//         });

//       expect(secondAttempt.status).toBe(200);
//       expect(secondAttempt.body.success).toBe(true);
//     });
//   });

//   describe('Login with SMS OTP 2FA', () => {
//     it('should complete full login flow with valid SMS OTP code', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'sms_otp', phone_number: '+1234567890' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       expect(loginResponse.status).toBe(200);
//       expect(loginResponse.body.requires_2fa).toBe(true);
//       expect(loginResponse.body.available_methods).toContain('sms_otp');

//       // Step 2: User verifies SMS OTP code
//       const sessionToken = loginResponse.body.session_token;
//       TwoFactorService.verifySMSOTP.mockResolvedValue({
//         isValid: true,
//         attemptsRemaining: 3,
//         isLocked: false,
//       });
//       mockUser.update.mockResolvedValue({});

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'sms_otp',
//         });

//       expect(verify2FAResponse.status).toBe(200);
//       expect(verify2FAResponse.body.success).toBe(true);
//       expect(verify2FAResponse.body.data.token).toBeDefined();
//     });

//     it('should enforce rate limiting on SMS OTP attempts', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'sms_otp', phone_number: '+1234567890' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       const sessionToken = loginResponse.body.session_token;

//       // Step 2: User exceeds 3 failed attempts
//       TwoFactorService.verifySMSOTP.mockResolvedValue({
//         isValid: false,
//         attemptsRemaining: 0,
//         isLocked: true,
//       });

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '000000',
//           method: 'sms_otp',
//         });

//       expect(verify2FAResponse.status).toBe(401);
//       expect(verify2FAResponse.body.success).toBe(false);
//       expect(verify2FAResponse.body.details.is_locked).toBe(true);
//     });
//   });

//   describe('Login with Backup Code 2FA', () => {
//     it('should complete full login flow with valid backup code', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       expect(loginResponse.status).toBe(200);
//       expect(loginResponse.body.requires_2fa).toBe(true);

//       // Step 2: User verifies with backup code instead of TOTP
//       const sessionToken = loginResponse.body.session_token;
//       TwoFactorService.verifyBackupCode.mockResolvedValue(true);
//       mockUser.update.mockResolvedValue({});

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: 'BACKUP123456',
//           method: 'backup_code',
//         });

//       expect(verify2FAResponse.status).toBe(200);
//       expect(verify2FAResponse.body.success).toBe(true);
//       expect(verify2FAResponse.body.data.token).toBeDefined();
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           details: expect.objectContaining({ verification_method: 'backup_code' }),
//         })
//       );
//     });

//     it('should reject invalid backup code', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       const sessionToken = loginResponse.body.session_token;

//       // Step 2: User provides invalid backup code
//       TwoFactorService.verifyBackupCode.mockResolvedValue(false);

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: 'INVALID123456',
//           method: 'backup_code',
//         });

//       expect(verify2FAResponse.status).toBe(401);
//       expect(verify2FAResponse.body.success).toBe(false);
//     });

//     it('should reject already-used backup code', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       const sessionToken = loginResponse.body.session_token;

//       // Step 2: User provides already-used backup code
//       TwoFactorService.verifyBackupCode.mockResolvedValue(false);

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: 'USED123456',
//           method: 'backup_code',
//         });

//       expect(verify2FAResponse.status).toBe(401);
//       expect(verify2FAResponse.body.success).toBe(false);
//     });
//   });

//   describe('Multiple 2FA Methods', () => {
//     it('should allow user to choose between multiple enabled 2FA methods', async () => {
//       // Step 1: User logs in with email and password
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       // User has both TOTP and Email OTP enabled
//       db.query.mockResolvedValue({
//         rows: [
//           { method_type: 'totp', secret_key: 'test-secret' },
//           { method_type: 'email_otp' }
//         ]
//       });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       expect(loginResponse.status).toBe(200);
//       expect(loginResponse.body.available_methods).toContain('totp');
//       expect(loginResponse.body.available_methods).toContain('email_otp');

//       // Step 2: User chooses to verify with Email OTP
//       const sessionToken = loginResponse.body.session_token;
//       TwoFactorService.verifyEmailOTP.mockResolvedValue({
//         isValid: true,
//         attemptsRemaining: 3,
//         isLocked: false,
//       });
//       mockUser.update.mockResolvedValue({});

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'email_otp',
//         });

//       expect(verify2FAResponse.status).toBe(200);
//       expect(verify2FAResponse.body.success).toBe(true);
//     });

//     it('should accept any valid 2FA method when multiple are enabled', async () => {
//       // User has both TOTP and Backup codes enabled
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({
//         rows: [
//           { method_type: 'totp', secret_key: 'test-secret' },
//           { method_type: 'backup_code' }
//         ]
//       });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       const sessionToken = loginResponse.body.session_token;

//       // User verifies with TOTP
//       TwoFactorService.verifyTOTPCode.mockReturnValue(true);
//       mockUser.update.mockResolvedValue({});

//       const verify2FAResponse = await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'totp',
//         });

//       expect(verify2FAResponse.status).toBe(200);
//       expect(verify2FAResponse.body.success).toBe(true);
//     });
//   });

//   describe('Login Audit Trail', () => {
//     it('should log successful login with 2FA', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       const sessionToken = loginResponse.body.session_token;
//       TwoFactorService.verifyTOTPCode.mockReturnValue(true);
//       mockUser.update.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '123456',
//           method: 'totp',
//         });

//       // Verify both login events were logged
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'pending_2fa',
//         })
//       );
//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'success',
//           details: expect.objectContaining({ method: '2fa' }),
//         })
//       );
//     });

//     it('should log failed 2FA verification attempts', async () => {
//       User.findByEmail.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] });
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const loginResponse = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: 'test@example.com',
//           password: 'ValidPassword123!',
//         });

//       const sessionToken = loginResponse.body.session_token;
//       TwoFactorService.verifyTOTPCode.mockReturnValue(false);

//       await request(app)
//         .post('/api/auth/verify-2fa')
//         .send({
//           session_token: sessionToken,
//           code: '000000',
//           method: 'totp',
//         });

//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'login',
//           status: 'failed',
//           details: expect.objectContaining({ reason: 'invalid_2fa_code' }),
//         })
//       );
//     });
//   });
// });
