// const TwoFactorService = require('./TwoFactorService');
// const db = require('../config/database');
// const bcrypt = require('bcryptjs');
// const speakeasy = require('speakeasy');

// // Mock database
// jest.mock('../config/database');

// describe('TwoFactorService', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('generateTOTPSecret()', () => {
//     it('should generate a TOTP secret with base32 encoding', async () => {
//       const userEmail = 'test@example.com';
//       const result = await TwoFactorService.generateTOTPSecret(userEmail);

//       expect(result).toHaveProperty('secret');
//       expect(result).toHaveProperty('qr_code');
//       expect(result).toHaveProperty('manual_entry_key');

//       // Base32 encoded secret should be a string of uppercase letters and numbers
//       expect(result.secret).toMatch(/^[A-Z2-7]+$/);
//       expect(result.manual_entry_key).toBe(result.secret);
//     });

//     it('should generate a valid QR code data URL', async () => {
//       const userEmail = 'test@example.com';
//       const result = await TwoFactorService.generateTOTPSecret(userEmail);

//       // QR code should be a data URL
//       expect(result.qr_code).toMatch(/^data:image\/png;base64,/);
//     });

//     it('should include user email in the secret label', async () => {
//       const userEmail = 'john@example.com';
//       const result = await TwoFactorService.generateTOTPSecret(userEmail);

//       // The secret should be generated with the email in the label
//       // We can verify this by checking that the secret is valid
//       expect(result.secret).toBeDefined();
//       expect(result.secret.length).toBeGreaterThan(0);
//     });

//     it('should generate different secrets on each call', async () => {
//       const userEmail = 'test@example.com';
//       const result1 = await TwoFactorService.generateTOTPSecret(userEmail);
//       const result2 = await TwoFactorService.generateTOTPSecret(userEmail);

//       expect(result1.secret).not.toBe(result2.secret);
//       expect(result1.qr_code).not.toBe(result2.qr_code);
//     });

//     it('should handle different email addresses', async () => {
//       const result1 = await TwoFactorService.generateTOTPSecret('user1@example.com');
//       const result2 = await TwoFactorService.generateTOTPSecret('user2@example.com');

//       expect(result1.secret).toBeDefined();
//       expect(result2.secret).toBeDefined();
//       expect(result1.secret).not.toBe(result2.secret);
//     });
//   });

//   describe('verifyTOTPCode()', () => {
//     it('should verify a valid TOTP code', () => {
//       // Generate a valid secret
//       const secret = speakeasy.generateSecret({
//         name: 'Test',
//         issuer: 'Test',
//         length: 32,
//       });

//       // Generate a valid code
//       const code = speakeasy.totp({
//         secret: secret.base32,
//         encoding: 'base32',
//       });

//       // Verify the code
//       const result = TwoFactorService.verifyTOTPCode(secret.base32, code);
//       expect(result).toBe(true);
//     });

//     it('should reject an invalid TOTP code', () => {
//       const secret = speakeasy.generateSecret({
//         name: 'Test',
//         issuer: 'Test',
//         length: 32,
//       });

//       // Use an invalid code
//       const result = TwoFactorService.verifyTOTPCode(secret.base32, '000000');
//       expect(result).toBe(false);
//     });

//     it('should accept codes within the time window', () => {
//       const secret = speakeasy.generateSecret({
//         name: 'Test',
//         issuer: 'Test',
//         length: 32,
//       });

//       // Generate a valid code
//       const code = speakeasy.totp({
//         secret: secret.base32,
//         encoding: 'base32',
//       });

//       // Verify with window of 1 (30 seconds before and after)
//       const result = TwoFactorService.verifyTOTPCode(secret.base32, code);
//       expect(result).toBe(true);
//     });

//     it('should handle 6-digit codes', () => {
//       const secret = speakeasy.generateSecret({
//         name: 'Test',
//         issuer: 'Test',
//         length: 32,
//       });

//       // Generate a valid code
//       const code = speakeasy.totp({
//         secret: secret.base32,
//         encoding: 'base32',
//       });

//       // Code should be 6 digits
//       expect(code).toMatch(/^\d{6}$/);

//       // Verify the code
//       const result = TwoFactorService.verifyTOTPCode(secret.base32, code);
//       expect(result).toBe(true);
//     });

//     it('should return false for invalid secret', () => {
//       const result = TwoFactorService.verifyTOTPCode('INVALID', '123456');
//       expect(result).toBe(false);
//     });

//     it('should return false for empty code', () => {
//       const secret = speakeasy.generateSecret({
//         name: 'Test',
//         issuer: 'Test',
//         length: 32,
//       });

//       const result = TwoFactorService.verifyTOTPCode(secret.base32, '');
//       expect(result).toBe(false);
//     });

//     it('should return false for non-numeric code', () => {
//       const secret = speakeasy.generateSecret({
//         name: 'Test',
//         issuer: 'Test',
//         length: 32,
//       });

//       const result = TwoFactorService.verifyTOTPCode(secret.base32, 'ABCDEF');
//       expect(result).toBe(false);
//     });
//   });

//   describe('generateBackupCodes()', () => {
//     it('should generate 10 backup codes by default', () => {
//       const codes = TwoFactorService.generateBackupCodes();

//       expect(codes).toHaveLength(10);
//     });

//     it('should generate custom number of backup codes', () => {
//       const codes = TwoFactorService.generateBackupCodes(5);
//       expect(codes).toHaveLength(5);

//       const codes20 = TwoFactorService.generateBackupCodes(20);
//       expect(codes20).toHaveLength(20);
//     });

//     it('should generate codes with code and code_hash properties', () => {
//       const codes = TwoFactorService.generateBackupCodes(1);

//       expect(codes[0]).toHaveProperty('code');
//       expect(codes[0]).toHaveProperty('code_hash');
//     });

//     it('should generate unique codes', () => {
//       const codes = TwoFactorService.generateBackupCodes(10);
//       const codeValues = codes.map(c => c.code);
//       const uniqueCodes = new Set(codeValues);

//       expect(uniqueCodes.size).toBe(10);
//     });

//     it('should generate 8-character hex codes', () => {
//       const codes = TwoFactorService.generateBackupCodes(5);

//       codes.forEach(({ code }) => {
//         expect(code).toMatch(/^[0-9A-F]{8}$/);
//         expect(code).toHaveLength(8);
//       });
//     });

//     it('should generate valid bcrypt hashes', () => {
//       const codes = TwoFactorService.generateBackupCodes(3);

//       codes.forEach(({ code, code_hash }) => {
//         // Verify hash is valid bcrypt format
//         expect(code_hash).toMatch(/^\$2[aby]\$/);

//         // Verify code matches hash
//         const isValid = bcrypt.compareSync(code, code_hash);
//         expect(isValid).toBe(true);
//       });
//     });

//     it('should generate uppercase hex codes', () => {
//       const codes = TwoFactorService.generateBackupCodes(10);

//       codes.forEach(({ code }) => {
//         expect(code).toBe(code.toUpperCase());
//       });
//     });

//     it('should handle zero codes', () => {
//       const codes = TwoFactorService.generateBackupCodes(0);
//       expect(codes).toHaveLength(0);
//     });

//     it('should handle large number of codes', () => {
//       const codes = TwoFactorService.generateBackupCodes(100);
//       expect(codes).toHaveLength(100);

//       // Verify all are unique
//       const codeValues = codes.map(c => c.code);
//       const uniqueCodes = new Set(codeValues);
//       expect(uniqueCodes.size).toBe(100);
//     });
//   });

//   describe('storeBackupCodes()', () => {
//     it('should delete existing backup codes for user', async () => {
//       const userId = 1;
//       const codes = TwoFactorService.generateBackupCodes(2);

//       db.query.mockResolvedValueOnce({ rowCount: 2 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert first code
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert second code

//       await TwoFactorService.storeBackupCodes(userId, codes);

//       // Verify delete query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('DELETE FROM user_2fa_backup_codes'),
//         [userId]
//       );
//     });

//     it('should store all backup codes in database', async () => {
//       const userId = 1;
//       const codes = TwoFactorService.generateBackupCodes(3);

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert first
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert second
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert third

//       await TwoFactorService.storeBackupCodes(userId, codes);

//       // Verify insert queries were called for each code
//       expect(db.query).toHaveBeenCalledTimes(4); // 1 delete + 3 inserts
//     });

//     it('should throw error if database query fails', async () => {
//       const userId = 1;
//       const codes = TwoFactorService.generateBackupCodes(1);

//       db.query.mockRejectedValueOnce(new Error('Database error'));

//       await expect(TwoFactorService.storeBackupCodes(userId, codes)).rejects.toThrow('Database error');
//     });

//     it('should mark codes as not used when storing', async () => {
//       const userId = 1;
//       const codes = TwoFactorService.generateBackupCodes(1);

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       await TwoFactorService.storeBackupCodes(userId, codes);

//       // Verify insert query includes is_used = false
//       const insertQuery = db.query.mock.calls[1][0];
//       expect(insertQuery).toContain('is_used');
//       expect(insertQuery).toContain('false');
//     });
//   });

//   describe('verifyBackupCode()', () => {
//     it('should return false if no unused backup codes found', async () => {
//       const userId = 1;
//       const code = 'ABCD1234';

//       db.query.mockResolvedValueOnce({ rows: [] });

//       const result = await TwoFactorService.verifyBackupCode(userId, code);

//       expect(result).toBe(false);
//     });

//     it('should return true if backup code is valid and unused', async () => {
//       const userId = 1;
//       const code = 'ABCD1234';
//       const codeHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [{ id: 1, code_hash: codeHash }],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Mark as used

//       const result = await TwoFactorService.verifyBackupCode(userId, code);

//       expect(result).toBe(true);
//     });

//     it('should mark backup code as used after verification', async () => {
//       const userId = 1;
//       const code = 'ABCD1234';
//       const codeHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [{ id: 1, code_hash: codeHash }],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Mark as used

//       await TwoFactorService.verifyBackupCode(userId, code);

//       // Verify update query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('UPDATE user_2fa_backup_codes'),
//         expect.arrayContaining([1])
//       );
//     });

//     it('should return false if code does not match any hash', async () => {
//       const userId = 1;
//       const code = 'WRONG1234';
//       const codeHash = bcrypt.hashSync('CORRECT1234', 10);

//       db.query.mockResolvedValueOnce({
//         rows: [{ id: 1, code_hash: codeHash }],
//       });

//       const result = await TwoFactorService.verifyBackupCode(userId, code);

//       expect(result).toBe(false);
//     });

//     it('should check multiple backup codes if first does not match', async () => {
//       const userId = 1;
//       const code = 'CORRECT12';
//       const wrongHash = bcrypt.hashSync('WRONG1234', 10);
//       const correctHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [
//           { id: 1, code_hash: wrongHash },
//           { id: 2, code_hash: correctHash },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Mark as used

//       const result = await TwoFactorService.verifyBackupCode(userId, code);

//       expect(result).toBe(true);
//     });

//     it('should throw error if database query fails', async () => {
//       const userId = 1;
//       const code = 'ABCD1234';

//       db.query.mockRejectedValueOnce(new Error('Database error'));

//       const result = await TwoFactorService.verifyBackupCode(userId, code);

//       expect(result).toBe(false);
//     });
//   });

//   describe('generateEmailOTP()', () => {
//     it('should generate a 6-digit code', () => {
//       const code = TwoFactorService.generateEmailOTP();

//       expect(code).toMatch(/^\d{6}$/);
//       expect(code).toHaveLength(6);
//     });

//     it('should generate numeric codes only', () => {
//       for (let i = 0; i < 10; i++) {
//         const code = TwoFactorService.generateEmailOTP();
//         expect(code).toMatch(/^\d{6}$/);
//       }
//     });

//     it('should generate different codes on each call', () => {
//       const code1 = TwoFactorService.generateEmailOTP();
//       const code2 = TwoFactorService.generateEmailOTP();
//       const code3 = TwoFactorService.generateEmailOTP();

//       // Codes should be different (with very high probability)
//       expect(code1).not.toBe(code2);
//       expect(code2).not.toBe(code3);
//     });

//     it('should generate codes in valid range (100000-999999)', () => {
//       for (let i = 0; i < 20; i++) {
//         const code = TwoFactorService.generateEmailOTP();
//         const codeNum = parseInt(code, 10);

//         expect(codeNum).toBeGreaterThanOrEqual(100000);
//         expect(codeNum).toBeLessThanOrEqual(999999);
//       }
//     });
//   });

//   describe('storeEmailOTP()', () => {
//     it('should delete existing OTP for user', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert new

//       await TwoFactorService.storeEmailOTP(userId, code);

//       // Verify delete query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('DELETE FROM email_otp_codes'),
//         [userId]
//       );
//     });

//     it('should store OTP with 5-minute expiration by default', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       const beforeTime = Date.now();
//       await TwoFactorService.storeEmailOTP(userId, code);
//       const afterTime = Date.now();

//       // Verify insert query was called with expiration time
//       const insertCall = db.query.mock.calls[1];
//       const expiresAt = insertCall[1][2]; // Third parameter is expires_at

//       // Should be approximately 5 minutes from now
//       const expectedExpiration = 5 * 60 * 1000;
//       const actualExpiration = expiresAt.getTime() - beforeTime;

//       expect(actualExpiration).toBeGreaterThan(expectedExpiration - 1000);
//       expect(actualExpiration).toBeLessThan(expectedExpiration + 1000);
//     });

//     it('should store OTP with custom expiration time', async () => {
//       const userId = 1;
//       const code = '123456';
//       const expiresInMinutes = 10;

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       const beforeTime = Date.now();
//       await TwoFactorService.storeEmailOTP(userId, code, expiresInMinutes);
//       const afterTime = Date.now();

//       // Verify insert query was called with correct expiration time
//       const insertCall = db.query.mock.calls[1];
//       const expiresAt = insertCall[1][2];

//       const expectedExpiration = expiresInMinutes * 60 * 1000;
//       const actualExpiration = expiresAt.getTime() - beforeTime;

//       expect(actualExpiration).toBeGreaterThan(expectedExpiration - 1000);
//       expect(actualExpiration).toBeLessThan(expectedExpiration + 1000);
//     });

//     it('should hash the OTP code before storing', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       await TwoFactorService.storeEmailOTP(userId, code);

//       // Verify insert query includes hashed code
//       const insertCall = db.query.mock.calls[1];
//       const codeHash = insertCall[1][1]; // Second parameter is code_hash

//       // Should be a bcrypt hash
//       expect(codeHash).toMatch(/^\$2[aby]\$/);

//       // Should match the original code
//       const isValid = bcrypt.compareSync(code, codeHash);
//       expect(isValid).toBe(true);
//     });

//     it('should initialize attempts to 0', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       await TwoFactorService.storeEmailOTP(userId, code);

//       // Verify insert query includes attempts = 0
//       const insertCall = db.query.mock.calls[1];
//       const query = insertCall[0];

//       expect(query).toContain('attempts');
//       expect(query).toContain('0');
//     });

//     it('should throw error if database query fails', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockRejectedValueOnce(new Error('Database error'));

//       await expect(TwoFactorService.storeEmailOTP(userId, code)).rejects.toThrow('Database error');
//     });
//   });

//   describe('verifyEmailOTP()', () => {
//     it('should return isValid: false if no OTP found', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rows: [] });

//       const result = await TwoFactorService.verifyEmailOTP(userId, code);

//       expect(result.isValid).toBe(false);
//       expect(result.attemptsRemaining).toBe(0);
//       expect(result.isLocked).toBe(false);
//     });

//     it('should return isLocked: true if 3 attempts exceeded', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: bcrypt.hashSync('654321', 10),
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 3,
//           },
//         ],
//       });

//       const result = await TwoFactorService.verifyEmailOTP(userId, code);

//       expect(result.isValid).toBe(false);
//       expect(result.isLocked).toBe(true);
//       expect(result.attemptsRemaining).toBe(0);
//     });

//     it('should return isValid: false if OTP expired', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: bcrypt.hashSync(code, 10),
//             expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
//             attempts: 0,
//           },
//         ],
//       });

//       const result = await TwoFactorService.verifyEmailOTP(userId, code);

//       expect(result.isValid).toBe(false);
//       expect(result.isLocked).toBe(false);
//     });

//     it('should return isValid: true if code matches and not expired', async () => {
//       const userId = 1;
//       const code = '123456';
//       const codeHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Delete OTP

//       const result = await TwoFactorService.verifyEmailOTP(userId, code);

//       expect(result.isValid).toBe(true);
//       expect(result.isLocked).toBe(false);
//     });

//     it('should delete OTP after successful verification', async () => {
//       const userId = 1;
//       const code = '123456';
//       const codeHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Delete OTP

//       await TwoFactorService.verifyEmailOTP(userId, code);

//       // Verify delete query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('DELETE FROM email_otp_codes'),
//         [1]
//       );
//     });

//     it('should increment attempts on failed verification', async () => {
//       const userId = 1;
//       const code = '123456';
//       const wrongCode = '654321';
//       const codeHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Update attempts

//       const result = await TwoFactorService.verifyEmailOTP(userId, wrongCode);

//       expect(result.isValid).toBe(false);
//       expect(result.attemptsRemaining).toBe(2);

//       // Verify update query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('UPDATE email_otp_codes'),
//         [1, 1]
//       );
//     });

//     it('should return correct attemptsRemaining after each failed attempt', async () => {
//       const userId = 1;
//       const code = '123456';
//       const wrongCode = '654321';
//       const codeHash = bcrypt.hashSync(code, 10);

//       // First attempt
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 });

//       const result1 = await TwoFactorService.verifyEmailOTP(userId, wrongCode);
//       expect(result1.attemptsRemaining).toBe(2);

//       // Second attempt
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 1,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 });

//       const result2 = await TwoFactorService.verifyEmailOTP(userId, wrongCode);
//       expect(result2.attemptsRemaining).toBe(1);

//       // Third attempt
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 2,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 });

//       const result3 = await TwoFactorService.verifyEmailOTP(userId, wrongCode);
//       expect(result3.attemptsRemaining).toBe(0);
//       expect(result3.isLocked).toBe(true);
//     });

//     it('should handle database errors gracefully', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockRejectedValueOnce(new Error('Database error'));

//       const result = await TwoFactorService.verifyEmailOTP(userId, code);

//       expect(result.isValid).toBe(false);
//       expect(result.attemptsRemaining).toBe(0);
//       expect(result.isLocked).toBe(false);
//     });
//   });

//   describe('Integration: TOTP Setup and Verification', () => {
//     it('should complete full TOTP setup and verification flow', async () => {
//       const userEmail = 'test@example.com';

//       // Step 1: Generate TOTP secret
//       const setup = await TwoFactorService.generateTOTPSecret(userEmail);
//       expect(setup.secret).toBeDefined();
//       expect(setup.qr_code).toBeDefined();

//       // Step 2: Generate backup codes
//       const backupCodes = TwoFactorService.generateBackupCodes(10);
//       expect(backupCodes).toHaveLength(10);

//       // Step 3: Verify TOTP code
//       const code = speakeasy.totp({
//         secret: setup.secret,
//         encoding: 'base32',
//       });

//       const isValid = TwoFactorService.verifyTOTPCode(setup.secret, code);
//       expect(isValid).toBe(true);

//       // Step 4: Verify backup code
//       const userId = 1;
//       db.query.mockResolvedValueOnce({
//         rows: [{ id: 1, code_hash: backupCodes[0].code_hash }],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 });

//       const backupCodeValid = await TwoFactorService.verifyBackupCode(userId, backupCodes[0].code);
//       expect(backupCodeValid).toBe(true);
//     });

//     it('should reject invalid TOTP code even with valid secret', () => {
//       const secret = speakeasy.generateSecret({
//         name: 'Test',
//         issuer: 'Test',
//         length: 32,
//       });

//       // Try with invalid code
//       const result = TwoFactorService.verifyTOTPCode(secret.base32, '000000');
//       expect(result).toBe(false);
//     });

//     it('should generate unique backup codes for each setup', () => {
//       const codes1 = TwoFactorService.generateBackupCodes(10);
//       const codes2 = TwoFactorService.generateBackupCodes(10);

//       const codeValues1 = codes1.map(c => c.code);
//       const codeValues2 = codes2.map(c => c.code);

//       // All codes should be unique across both sets
//       const allCodes = new Set([...codeValues1, ...codeValues2]);
//       expect(allCodes.size).toBe(20);
//     });
//   });

//   describe('Integration: Email OTP Setup and Verification', () => {
//     it('should complete full Email OTP setup and verification flow', async () => {
//       const userId = 1;

//       // Step 1: Generate Email OTP
//       const code = TwoFactorService.generateEmailOTP();
//       expect(code).toMatch(/^\d{6}$/);

//       // Step 2: Store Email OTP
//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       await TwoFactorService.storeEmailOTP(userId, code);

//       // Step 3: Verify Email OTP
//       const codeHash = bcrypt.hashSync(code, 10);
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Delete OTP

//       const result = await TwoFactorService.verifyEmailOTP(userId, code);
//       expect(result.isValid).toBe(true);
//     });

//     it('should reject Email OTP after 3 failed attempts', async () => {
//       const userId = 1;
//       const code = '123456';
//       const wrongCode = '654321';
//       const codeHash = bcrypt.hashSync(code, 10);

//       // Simulate 3 failed attempts
//       for (let i = 0; i < 3; i++) {
//         db.query.mockResolvedValueOnce({
//           rows: [
//             {
//               id: 1,
//               code_hash: codeHash,
//               expires_at: new Date(Date.now() + 5 * 60 * 1000),
//               attempts: i,
//             },
//           ],
//         });
//         db.query.mockResolvedValueOnce({ rowCount: 1 });

//         const result = await TwoFactorService.verifyEmailOTP(userId, wrongCode);
//         expect(result.isValid).toBe(false);
//       }

//       // Fourth attempt should be locked
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 3,
//           },
//         ],
//       });

//       const result = await TwoFactorService.verifyEmailOTP(userId, wrongCode);
//       expect(result.isLocked).toBe(true);
//     });
//   });

//   describe('generateSMSOTP()', () => {
//     it('should generate a 6-digit code', () => {
//       const code = TwoFactorService.generateSMSOTP();

//       expect(code).toMatch(/^\d{6}$/);
//       expect(code).toHaveLength(6);
//     });

//     it('should generate numeric codes only', () => {
//       for (let i = 0; i < 10; i++) {
//         const code = TwoFactorService.generateSMSOTP();
//         expect(code).toMatch(/^\d{6}$/);
//       }
//     });

//     it('should generate different codes on each call', () => {
//       const code1 = TwoFactorService.generateSMSOTP();
//       const code2 = TwoFactorService.generateSMSOTP();
//       const code3 = TwoFactorService.generateSMSOTP();

//       // Codes should be different (with very high probability)
//       expect(code1).not.toBe(code2);
//       expect(code2).not.toBe(code3);
//     });

//     it('should generate codes in valid range (100000-999999)', () => {
//       for (let i = 0; i < 20; i++) {
//         const code = TwoFactorService.generateSMSOTP();
//         const codeNum = parseInt(code, 10);

//         expect(codeNum).toBeGreaterThanOrEqual(100000);
//         expect(codeNum).toBeLessThanOrEqual(999999);
//       }
//     });
//   });

//   describe('storeSMSOTP()', () => {
//     it('should delete existing OTP for user', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert new

//       await TwoFactorService.storeSMSOTP(userId, code);

//       // Verify delete query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('DELETE FROM sms_otp_codes'),
//         [userId]
//       );
//     });

//     it('should store OTP with 5-minute expiration by default', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       const beforeTime = Date.now();
//       await TwoFactorService.storeSMSOTP(userId, code);
//       const afterTime = Date.now();

//       // Verify insert query was called with expiration time
//       const insertCall = db.query.mock.calls[1];
//       const expiresAt = insertCall[1][2]; // Third parameter is expires_at

//       // Should be approximately 5 minutes from now
//       const expectedExpiration = 5 * 60 * 1000;
//       const actualExpiration = expiresAt.getTime() - beforeTime;

//       expect(actualExpiration).toBeGreaterThan(expectedExpiration - 1000);
//       expect(actualExpiration).toBeLessThan(expectedExpiration + 1000);
//     });

//     it('should store OTP with custom expiration time', async () => {
//       const userId = 1;
//       const code = '123456';
//       const expiresInMinutes = 10;

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       const beforeTime = Date.now();
//       await TwoFactorService.storeSMSOTP(userId, code, expiresInMinutes);
//       const afterTime = Date.now();

//       // Verify insert query was called with correct expiration time
//       const insertCall = db.query.mock.calls[1];
//       const expiresAt = insertCall[1][2];

//       const expectedExpiration = expiresInMinutes * 60 * 1000;
//       const actualExpiration = expiresAt.getTime() - beforeTime;

//       expect(actualExpiration).toBeGreaterThan(expectedExpiration - 1000);
//       expect(actualExpiration).toBeLessThan(expectedExpiration + 1000);
//     });

//     it('should hash the OTP code before storing', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       await TwoFactorService.storeSMSOTP(userId, code);

//       // Verify insert query includes hashed code
//       const insertCall = db.query.mock.calls[1];
//       const codeHash = insertCall[1][1]; // Second parameter is code_hash

//       // Should be a bcrypt hash
//       expect(codeHash).toMatch(/^\$2[aby]\$/);

//       // Should match the original code
//       const isValid = bcrypt.compareSync(code, codeHash);
//       expect(isValid).toBe(true);
//     });

//     it('should initialize attempts to 0', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       await TwoFactorService.storeSMSOTP(userId, code);

//       // Verify insert query includes attempts = 0
//       const insertCall = db.query.mock.calls[1];
//       const query = insertCall[0];

//       expect(query).toContain('attempts');
//       expect(query).toContain('0');
//     });

//     it('should throw error if database query fails', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockRejectedValueOnce(new Error('Database error'));

//       await expect(TwoFactorService.storeSMSOTP(userId, code)).rejects.toThrow('Database error');
//     });
//   });

//   describe('verifySMSOTP()', () => {
//     it('should return isValid: false if no OTP found', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({ rows: [] });

//       const result = await TwoFactorService.verifySMSOTP(userId, code);

//       expect(result.isValid).toBe(false);
//       expect(result.attemptsRemaining).toBe(0);
//       expect(result.isLocked).toBe(false);
//     });

//     it('should return isLocked: true if 3 attempts exceeded', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: bcrypt.hashSync('654321', 10),
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 3,
//           },
//         ],
//       });

//       const result = await TwoFactorService.verifySMSOTP(userId, code);

//       expect(result.isValid).toBe(false);
//       expect(result.isLocked).toBe(true);
//       expect(result.attemptsRemaining).toBe(0);
//     });

//     it('should return isValid: false if OTP expired', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: bcrypt.hashSync(code, 10),
//             expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
//             attempts: 0,
//           },
//         ],
//       });

//       const result = await TwoFactorService.verifySMSOTP(userId, code);

//       expect(result.isValid).toBe(false);
//       expect(result.isLocked).toBe(false);
//     });

//     it('should return isValid: true if code matches and not expired', async () => {
//       const userId = 1;
//       const code = '123456';
//       const codeHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Delete OTP

//       const result = await TwoFactorService.verifySMSOTP(userId, code);

//       expect(result.isValid).toBe(true);
//       expect(result.isLocked).toBe(false);
//     });

//     it('should delete OTP after successful verification', async () => {
//       const userId = 1;
//       const code = '123456';
//       const codeHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Delete OTP

//       await TwoFactorService.verifySMSOTP(userId, code);

//       // Verify delete query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('DELETE FROM sms_otp_codes'),
//         [1]
//       );
//     });

//     it('should increment attempts on failed verification', async () => {
//       const userId = 1;
//       const code = '123456';
//       const wrongCode = '654321';
//       const codeHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Update attempts

//       const result = await TwoFactorService.verifySMSOTP(userId, wrongCode);

//       expect(result.isValid).toBe(false);
//       expect(result.attemptsRemaining).toBe(2);

//       // Verify update query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('UPDATE sms_otp_codes'),
//         [1, 1]
//       );
//     });

//     it('should return correct attemptsRemaining after each failed attempt', async () => {
//       const userId = 1;
//       const code = '123456';
//       const wrongCode = '654321';
//       const codeHash = bcrypt.hashSync(code, 10);

//       // First attempt
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 });

//       const result1 = await TwoFactorService.verifySMSOTP(userId, wrongCode);
//       expect(result1.attemptsRemaining).toBe(2);

//       // Second attempt
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 1,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 });

//       const result2 = await TwoFactorService.verifySMSOTP(userId, wrongCode);
//       expect(result2.attemptsRemaining).toBe(1);

//       // Third attempt
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 2,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 });

//       const result3 = await TwoFactorService.verifySMSOTP(userId, wrongCode);
//       expect(result3.attemptsRemaining).toBe(0);
//       expect(result3.isLocked).toBe(true);
//     });

//     it('should handle database errors gracefully', async () => {
//       const userId = 1;
//       const code = '123456';

//       db.query.mockRejectedValueOnce(new Error('Database error'));

//       const result = await TwoFactorService.verifySMSOTP(userId, code);

//       expect(result.isValid).toBe(false);
//       expect(result.attemptsRemaining).toBe(0);
//       expect(result.isLocked).toBe(false);
//     });
//   });

//   describe('Integration: SMS OTP Setup and Verification', () => {
//     it('should complete full SMS OTP setup and verification flow', async () => {
//       const userId = 1;

//       // Step 1: Generate SMS OTP
//       const code = TwoFactorService.generateSMSOTP();
//       expect(code).toMatch(/^\d{6}$/);

//       // Step 2: Store SMS OTP
//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Delete existing
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Insert

//       await TwoFactorService.storeSMSOTP(userId, code);

//       // Step 3: Verify SMS OTP
//       const codeHash = bcrypt.hashSync(code, 10);
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 0,
//           },
//         ],
//       });
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Delete OTP

//       const result = await TwoFactorService.verifySMSOTP(userId, code);
//       expect(result.isValid).toBe(true);
//     });

//     it('should reject SMS OTP after 3 failed attempts', async () => {
//       const userId = 1;
//       const code = '123456';
//       const wrongCode = '654321';
//       const codeHash = bcrypt.hashSync(code, 10);

//       // Simulate 3 failed attempts
//       for (let i = 0; i < 3; i++) {
//         db.query.mockResolvedValueOnce({
//           rows: [
//             {
//               id: 1,
//               code_hash: codeHash,
//               expires_at: new Date(Date.now() + 5 * 60 * 1000),
//               attempts: i,
//             },
//           ],
//         });
//         db.query.mockResolvedValueOnce({ rowCount: 1 });

//         const result = await TwoFactorService.verifySMSOTP(userId, wrongCode);
//         expect(result.isValid).toBe(false);
//       }

//       // Fourth attempt should be locked
//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() + 5 * 60 * 1000),
//             attempts: 3,
//           },
//         ],
//       });

//       const result = await TwoFactorService.verifySMSOTP(userId, wrongCode);
//       expect(result.isLocked).toBe(true);
//     });

//     it('should reject SMS OTP after expiration', async () => {
//       const userId = 1;
//       const code = '123456';
//       const codeHash = bcrypt.hashSync(code, 10);

//       db.query.mockResolvedValueOnce({
//         rows: [
//           {
//             id: 1,
//             code_hash: codeHash,
//             expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
//             attempts: 0,
//           },
//         ],
//       });

//       const result = await TwoFactorService.verifySMSOTP(userId, code);
//       expect(result.isValid).toBe(false);
//       expect(result.isLocked).toBe(false);
//     });
//   });
// });
