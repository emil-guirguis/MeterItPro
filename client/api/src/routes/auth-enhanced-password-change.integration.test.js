// /**
//  * Integration Tests for Password Change Flow
//  * Tests for POST /api/auth/change-password
//  * 
//  * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12
//  */

// const request = require('supertest');
// const express = require('express');
// const authEnhancedRoutes = require('./auth-enhanced');
// const User = require('../models/UserWithSchema');
// const AuthLoggingService = require('../services/AuthLoggingService');
// const PasswordValidator = require('../services/PasswordValidator');
// const { authenticateToken } = require('../middleware/auth');

// // Mock dependencies
// jest.mock('../models/UserWithSchema');
// jest.mock('../services/AuthLoggingService');
// jest.mock('../services/PasswordValidator');
// jest.mock('../middleware/auth');

// describe('Integration: Password Change Flow', () => {
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

//     // Reset all mocks
//     jest.clearAllMocks();
//   });

//   describe('Successful Password Change', () => {
//     it('should successfully change password with valid current password', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword
//         .mockResolvedValueOnce(true) // Current password is correct
//         .mockResolvedValueOnce(false); // New password is different
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
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.message).toContain('Password changed successfully');

//       // Verify password was hashed and updated
//       expect(User.hashPassword).toHaveBeenCalledWith('NewPassword123!@#');
//       expect(mockUser.update).toHaveBeenCalledWith(
//         expect.objectContaining({
//           passwordHash: '$2b$10$newhash',
//           password_changed_at: expect.any(Date),
//         })
//       );

//       // Verify logging
//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(1, true);
//     });

//     it('should update last_login_at timestamp after successful password change', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword
//         .mockResolvedValueOnce(true)
//         .mockResolvedValueOnce(false);
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
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(200);
//       expect(mockUser.update).toHaveBeenCalledWith(
//         expect.objectContaining({
//           password_changed_at: expect.any(Date),
//         })
//       );
//     });

//     it('should log successful password change', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword
//         .mockResolvedValueOnce(true)
//         .mockResolvedValueOnce(false);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       User.hashPassword.mockResolvedValue('$2b$10$newhash');
//       mockUser.update.mockResolvedValue({});
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(1, true);
//     });
//   });

//   describe('Invalid Current Password', () => {
//     it('should reject if current password is incorrect', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(false);
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'WrongPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Current password is incorrect');

//       // Verify password was not updated
//       expect(mockUser.update).not.toHaveBeenCalled();

//       // Verify failure was logged
//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(
//         1,
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'invalid_current_password' }),
//         })
//       );
//     });

//     it('should not update password if current password verification fails', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(false);
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'WrongPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(User.hashPassword).not.toHaveBeenCalled();
//       expect(mockUser.update).not.toHaveBeenCalled();
//     });
//   });

//   describe('Password Validation Failures', () => {
//     it('should reject if new password does not meet security requirements', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: false,
//         errors: [
//           'Password must be at least 12 characters long',
//           'Password must contain at least one special character',
//         ],
//       });
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'Short1!',
//           confirmPassword: 'Short1!',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Password does not meet security requirements');
//       expect(response.body.errors).toContain('Password must be at least 12 characters long');
//       expect(response.body.errors).toContain('Password must contain at least one special character');

//       // Verify password was not updated
//       expect(mockUser.update).not.toHaveBeenCalled();

//       // Verify failure was logged
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
//         .mockResolvedValueOnce(true) // Current password is correct
//         .mockResolvedValueOnce(true); // New password matches current
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'OldPassword123!',
//           confirmPassword: 'OldPassword123!',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('New password must be different from current password');

//       // Verify password was not updated
//       expect(mockUser.update).not.toHaveBeenCalled();

//       // Verify failure was logged
//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(
//         1,
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'same_as_current' }),
//         })
//       );
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
//           currentPassword: 'OldPassword123!',
//           newPassword: 'test@example.com123!',
//           confirmPassword: 'test@example.com123!',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.errors).toContain('Password cannot contain your email address');

//       // Verify validator was called with email
//       expect(PasswordValidator.validate).toHaveBeenCalledWith(
//         'test@example.com123!',
//         'test@example.com'
//       );
//     });

//     it('should reject if passwords do not match', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword.mockResolvedValue(true);
//       AuthLoggingService.logPasswordChange.mockResolvedValue({});

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'DifferentPassword123!@#',
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Passwords do not match');

//       // Verify password was not updated
//       expect(mockUser.update).not.toHaveBeenCalled();

//       // Verify failure was logged
//       expect(AuthLoggingService.logPasswordChange).toHaveBeenCalledWith(
//         1,
//         false,
//         expect.objectContaining({
//           details: expect.objectContaining({ reason: 'passwords_do_not_match' }),
//         })
//       );
//     });
//   });

//   describe('Error Handling', () => {
//     it('should return 404 if user not found', async () => {
//       User.findById.mockResolvedValue(null);

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(404);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('User not found');
//     });

//     it('should handle database errors gracefully', async () => {
//       User.findById.mockRejectedValue(new Error('Database connection failed'));

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Failed to change password');
//     });

//     it('should handle password hashing errors gracefully', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword
//         .mockResolvedValueOnce(true)
//         .mockResolvedValueOnce(false);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       User.hashPassword.mockRejectedValue(new Error('Hashing failed'));

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Failed to change password');
//     });

//     it('should handle update errors gracefully', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword
//         .mockResolvedValueOnce(true)
//         .mockResolvedValueOnce(false);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       User.hashPassword.mockResolvedValue('$2b$10$newhash');
//       mockUser.update.mockRejectedValue(new Error('Update failed'));

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(500);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Failed to change password');
//     });
//   });

//   describe('Input Validation', () => {
//     it('should validate required fields', async () => {
//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           // Missing newPassword and confirmPassword
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('Validation failed');
//     });

//     it('should require authentication', async () => {
//       authenticateToken.mockImplementation((req, res, next) => {
//         res.status(401).json({ success: false, message: 'Unauthorized' });
//       });

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(401);
//     });
//   });

//   describe('Password Change Atomicity', () => {
//     it('should ensure password change is atomic - all or nothing', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword
//         .mockResolvedValueOnce(true)
//         .mockResolvedValueOnce(false);
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
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(200);

//       // Verify that both password hash and timestamp were updated together
//       expect(mockUser.update).toHaveBeenCalledWith(
//         expect.objectContaining({
//           passwordHash: '$2b$10$newhash',
//           password_changed_at: expect.any(Date),
//         })
//       );

//       // Verify update was called exactly once (atomic operation)
//       expect(mockUser.update).toHaveBeenCalledTimes(1);
//     });

//     it('should not partially update password if update fails', async () => {
//       User.findById.mockResolvedValue(mockUser);
//       mockUser.comparePassword
//         .mockResolvedValueOnce(true)
//         .mockResolvedValueOnce(false);
//       PasswordValidator.validate.mockReturnValue({
//         isValid: true,
//         errors: [],
//       });
//       User.hashPassword.mockResolvedValue('$2b$10$newhash');
//       mockUser.update.mockRejectedValue(new Error('Update failed'));

//       const response = await request(app)
//         .post('/api/auth/change-password')
//         .send({
//           currentPassword: 'OldPassword123!',
//           newPassword: 'NewPassword123!@#',
//           confirmPassword: 'NewPassword123!@#',
//         });

//       expect(response.status).toBe(500);
//       // Update was attempted but failed
//       expect(mockUser.update).toHaveBeenCalled();
//     });
//   });
// });
