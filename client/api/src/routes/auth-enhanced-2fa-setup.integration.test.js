// /**
//  * Integration Tests for 2FA Setup and Management
//  * Tests for POST /api/auth/2fa/setup, /verify-setup, /disable, /regenerate-backup-codes
//  * 
//  * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15, 8.1, 8.2, 8.3, 8.4, 8.7, 8.8, 8.9
//  */

// const request = require('supertest');
// const express = require('express');
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

// describe('Integration: 2FA Setup and Management', () => {
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
//       comparePassword: jest.fn(),
//       update: jest.fn(),
//     };
//   });

//   describe('TOTP Setup', () => {
//     it('should generate TOTP secret and QR code during setup', async () => {
//       TwoFactorService.generateTOTPSecret.mockReturnValue({
//         secret: 'JBSWY3DPEBLW64TMMQ======',
//         qr_code: 'data:image/png;base64,...',
//       });

//       const response = await request(app)
//         .post('/api/auth/2fa/setup')
//         .send({
//           method: 'totp',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data.secret).toBeDefined();
//       expect(response.body.data.qr_code).toBeDefined();
//       expect(TwoFactorService.generateTOTPSecret).toHaveBeenCalled();
//     });

//     it('should display secret as text string for manual entry', async () => {
//       TwoFactorService.generateTOTPSecret.mockReturnValue({
//         secret: 'JBSWY3DPEBLW64TMMQ======',
//         qr_code: 'data:image/png;base64,...',
//       });

//       const response = await request(app)
//         .post('/api/auth/2fa/setup')
//         .send({
//           method: 'totp',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.data.secret).toBe('JBSWY3DPEBLW64TMMQ======');
//     });

//     it('should verify TOTP code during setup', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyTOTPCode.mockReturnValue(true);
//       TwoFactorService.generateBackupCodes.mockReturnValue([
//         { code: 'BACKUP001' },
//         { code: 'BACKUP002' },
//       ]);
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'totp',
//           code: '123456',
//           secret: 'JBSWY3DPEBLW64TMMQ======',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(TwoFactorService.verifyTOTPCode).toHaveBeenCalledWith(
//         'JBSWY3DPEBLW64TMMQ======',
//         '123456'
//       );
//     });

//     it('should reject invalid TOTP code during setup', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyTOTPCode.mockReturnValue(false);
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'totp',
//           code: '000000',
//           secret: 'JBSWY3DPEBLW64TMMQ======',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Invalid 2FA code');
//     });

//     it('should generate and return backup codes after TOTP setup', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyTOTPCode.mockReturnValue(true);
//       TwoFactorService.generateBackupCodes.mockReturnValue([
//         { code: 'BACKUP001' },
//         { code: 'BACKUP002' },
//         { code: 'BACKUP003' },
//         { code: 'BACKUP004' },
//         { code: 'BACKUP005' },
//         { code: 'BACKUP006' },
//         { code: 'BACKUP007' },
//         { code: 'BACKUP008' },
//         { code: 'BACKUP009' },
//         { code: 'BACKUP010' },
//       ]);
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'totp',
//           code: '123456',
//           secret: 'JBSWY3DPEBLW64TMMQ======',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.data.backup_codes).toBeDefined();
//       expect(response.body.data.backup_codes.length).toBe(10);
//       expect(TwoFactorService.generateBackupCodes).toHaveBeenCalledWith(10);
//     });

//     it('should store TOTP secret in database after verification', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyTOTPCode.mockReturnValue(true);
//       TwoFactorService.generateBackupCodes.mockReturnValue([]);
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'totp',
//           code: '123456',
//           secret: 'JBSWY3DPEBLW64TMMQ======',
//         });

//       // Verify that 2FA method was stored
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('INSERT INTO user_2fa_methods'),
//         expect.arrayContaining([1, 'totp', 'JBSWY3DPEBLW64TMMQ======'])
//       );
//     });
//   });

//   describe('Email OTP Setup', () => {
//     it('should enable Email OTP 2FA', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/setup')
//         .send({
//           method: 'email_otp',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//     });

//     it('should verify Email OTP setup with code', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyEmailOTP.mockResolvedValue({
//         isValid: true,
//         attemptsRemaining: 3,
//         isLocked: false,
//       });
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'email_otp',
//           code: '123456',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//     });

//     it('should store Email OTP method in database', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyEmailOTP.mockResolvedValue({
//         isValid: true,
//         attemptsRemaining: 3,
//         isLocked: false,
//       });
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'email_otp',
//           code: '123456',
//         });

//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('INSERT INTO user_2fa_methods'),
//         expect.arrayContaining([1, 'email_otp'])
//       );
//     });
//   });

//   describe('SMS OTP Setup', () => {
//     it('should request phone number for SMS OTP setup', async () => {
//       const response = await request(app)
//         .post('/api/auth/2fa/setup')
//         .send({
//           method: 'sms_otp',
//           phone_number: '+1234567890',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//     });

//     it('should validate phone number format', async () => {
//       const response = await request(app)
//         .post('/api/auth/2fa/setup')
//         .send({
//           method: 'sms_otp',
//           phone_number: 'invalid-phone',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Invalid phone number');
//     });

//     it('should verify SMS OTP setup with code', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifySMSOTP.mockResolvedValue({
//         isValid: true,
//         attemptsRemaining: 3,
//         isLocked: false,
//       });
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'sms_otp',
//           code: '123456',
//           phone_number: '+1234567890',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//     });

//     it('should store SMS OTP method with phone number in database', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifySMSOTP.mockResolvedValue({
//         isValid: true,
//         attemptsRemaining: 3,
//         isLocked: false,
//       });
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'sms_otp',
//           code: '123456',
//           phone_number: '+1234567890',
//         });

//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('INSERT INTO user_2fa_methods'),
//         expect.arrayContaining([1, 'sms_otp', '+1234567890'])
//       );
//     });
//   });

//   describe('Get 2FA Methods', () => {
//     it('should return all enabled 2FA methods for user', async () => {
//       db.query.mockResolvedValue({
//         rows: [
//           { method_type: 'totp', is_enabled: true, created_at: new Date() },
//           { method_type: 'email_otp', is_enabled: true, created_at: new Date() },
//         ],
//       });

//       const response = await request(app)
//         .get('/api/auth/2fa/methods');

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data.methods).toHaveLength(2);
//       expect(response.body.data.methods[0].method_type).toBe('totp');
//       expect(response.body.data.methods[1].method_type).toBe('email_otp');
//     });

//     it('should return empty list if no 2FA methods enabled', async () => {
//       db.query.mockResolvedValue({ rows: [] });

//       const response = await request(app)
//         .get('/api/auth/2fa/methods');

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data.methods).toHaveLength(0);
//     });
//   });

//   describe('Disable 2FA', () => {
//     it('should disable 2FA method with password confirmation', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/disable')
//         .send({
//           method: 'totp',
//           password: 'ValidPassword123!',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.message).toContain('2FA method disabled');
//     });

//     it('should reject if password is incorrect', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(false);
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/disable')
//         .send({
//           method: 'totp',
//           password: 'WrongPassword123!',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Password is incorrect');
//     });

//     it('should update database to disable 2FA method', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/2fa/disable')
//         .send({
//           method: 'totp',
//           password: 'ValidPassword123!',
//         });

//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('UPDATE user_2fa_methods'),
//         expect.arrayContaining([false, 1, 'totp'])
//       );
//     });

//     it('should log 2FA disable event', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/2fa/disable')
//         .send({
//           method: 'totp',
//           password: 'ValidPassword123!',
//         });

//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: '2fa_disable',
//           status: 'success',
//           details: expect.objectContaining({ method: 'totp' }),
//         })
//       );
//     });
//   });

//   describe('Regenerate Backup Codes', () => {
//     it('should regenerate backup codes with password confirmation', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       TwoFactorService.generateBackupCodes.mockReturnValue([
//         { code: 'NEWBACKUP001' },
//         { code: 'NEWBACKUP002' },
//       ]);
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/regenerate-backup-codes')
//         .send({
//           password: 'ValidPassword123!',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data.backup_codes).toBeDefined();
//       expect(response.body.data.backup_codes.length).toBe(2);
//     });

//     it('should reject if password is incorrect', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(false);
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/regenerate-backup-codes')
//         .send({
//           password: 'WrongPassword123!',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Password is incorrect');
//     });

//     it('should invalidate old backup codes', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       TwoFactorService.generateBackupCodes.mockReturnValue([]);
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/2fa/regenerate-backup-codes')
//         .send({
//           password: 'ValidPassword123!',
//         });

//       // Verify old codes were marked as used
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('UPDATE user_2fa_backup_codes'),
//         expect.arrayContaining([1])
//       );
//     });

//     it('should generate exactly 10 new backup codes', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       TwoFactorService.generateBackupCodes.mockReturnValue(
//         Array.from({ length: 10 }, (_, i) => ({ code: `BACKUP${i + 1}` }))
//       );
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/2fa/regenerate-backup-codes')
//         .send({
//           password: 'ValidPassword123!',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.data.backup_codes.length).toBe(10);
//       expect(TwoFactorService.generateBackupCodes).toHaveBeenCalledWith(10);
//     });

//     it('should log backup code regeneration event', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       TwoFactorService.generateBackupCodes.mockReturnValue([]);
//       db.query.mockResolvedValue({ rows: [] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/2fa/regenerate-backup-codes')
//         .send({
//           password: 'ValidPassword123!',
//         });

//       expect(AuthLoggingService.logEvent).toHaveBeenCalledWith(
//         expect.objectContaining({
//           eventType: 'backup_codes_regenerated',
//           status: 'success',
//         })
//       );
//     });
//   });

//   describe('Multiple 2FA Methods Management', () => {
//     it('should allow user to have multiple 2FA methods enabled', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       TwoFactorService.verifyTOTPCode.mockReturnValue(true);
//       TwoFactorService.generateBackupCodes.mockReturnValue([]);
//       db.query
//         .mockResolvedValueOnce({ rows: [] }) // Check existing methods
//         .mockResolvedValueOnce({ rows: [] }); // Insert new method
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       // Setup TOTP
//       const totpResponse = await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'totp',
//           code: '123456',
//           secret: 'JBSWY3DPEBLW64TMMQ======',
//         });

//       expect(totpResponse.status).toBe(200);

//       // Setup Email OTP
//       TwoFactorService.verifyEmailOTP.mockResolvedValue({
//         isValid: true,
//         attemptsRemaining: 3,
//         isLocked: false,
//       });

//       const emailResponse = await request(app)
//         .post('/api/auth/2fa/verify-setup')
//         .send({
//           method: 'email_otp',
//           code: '123456',
//         });

//       expect(emailResponse.status).toBe(200);

//       // Get methods
//       db.query.mockResolvedValue({
//         rows: [
//           { method_type: 'totp', is_enabled: true },
//           { method_type: 'email_otp', is_enabled: true },
//         ],
//       });

//       const getResponse = await request(app)
//         .get('/api/auth/2fa/methods');

//       expect(getResponse.status).toBe(200);
//       expect(getResponse.body.data.methods).toHaveLength(2);
//     });

//     it('should allow disabling one method while keeping others enabled', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       db.query.mockResolvedValue({ rows: [{ method_type: 'totp' }] });
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logEvent.mockResolvedValue({});

//       // Disable TOTP
//       const disableResponse = await request(app)
//         .post('/api/auth/2fa/disable')
//         .send({
//           method: 'totp',
//           password: 'ValidPassword123!',
//         });

//       expect(disableResponse.status).toBe(200);

//       // Get remaining methods
//       db.query.mockResolvedValue({
//         rows: [
//           { method_type: 'email_otp', is_enabled: true },
//         ],
//       });

//       const getResponse = await request(app)
//         .get('/api/auth/2fa/methods');

//       expect(getResponse.status).toBe(200);
//       expect(getResponse.body.data.methods).toHaveLength(1);
//       expect(getResponse.body.data.methods[0].method_type).toBe('email_otp');
//     });
//   });

//   describe('Error Handling', () => {
//     it('should require authentication for 2FA endpoints', async () => {
//       authenticateToken.mockImplementation((req, res, next) => {
//         res.status(401).json({ success: false, message: 'Unauthorized' });
//       });

//       const response = await request(app)
//         .post('/api/auth/2fa/setup')
//         .send({
//           method: 'totp',
//         });

//       expect(response.status).toBe(401);
//     });

//     it('should handle database errors gracefully', async () => {
//       User.findById.mockRejectedValue(new Error('Database connection failed'));

//       const response = await request(app)
//         .post('/api/auth/2fa/disable')
//         .send({
//           method: 'totp',
//           password: 'ValidPassword123!',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//     });

//     it('should return 404 if user not found', async () => {
//       User.findById.mockResolvedValue(null);

//       const response = await request(app)
//         .post('/api/auth/2fa/disable')
//         .send({
//           method: 'totp',
//           password: 'ValidPassword123!',
//         });

//       expect(response.status).toBe(404);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('User not found');
//     });
//   });
// });
