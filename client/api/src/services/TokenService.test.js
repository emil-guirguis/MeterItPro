// const TokenService = require('./TokenService');
// const db = require('../config/database');
// const bcrypt = require('bcryptjs');

// // Mock database
// jest.mock('../config/database');

// describe('TokenService', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('generateResetToken()', () => {
//     it('should generate a token with default length of 32 bytes', () => {
//       const result = TokenService.generateResetToken();
      
//       expect(result).toHaveProperty('token');
//       expect(result).toHaveProperty('token_hash');
//       expect(result).toHaveProperty('expires_at');
      
//       // Token should be 64 characters (32 bytes in hex)
//       expect(result.token).toHaveLength(64);
//     });

//     it('should generate a token with custom length', () => {
//       const result = TokenService.generateResetToken(16);
      
//       // Token should be 32 characters (16 bytes in hex)
//       expect(result.token).toHaveLength(32);
//     });

//     it('should generate a valid bcrypt hash', () => {
//       const result = TokenService.generateResetToken();
      
//       // Verify the hash is valid bcrypt format
//       expect(result.token_hash).toMatch(/^\$2[aby]\$/);
      
//       // Verify the token matches the hash
//       const isValid = bcrypt.compareSync(result.token, result.token_hash);
//       expect(isValid).toBe(true);
//     });

//     it('should set expiration to 24 hours from now', () => {
//       const beforeGeneration = Date.now();
//       const result = TokenService.generateResetToken();
//       const afterGeneration = Date.now();
      
//       const expirationTime = new Date(result.expires_at).getTime();
//       const expectedExpiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
//       // Allow 1 second tolerance for test execution time
//       expect(expirationTime - beforeGeneration).toBeGreaterThanOrEqual(expectedExpiration - 1000);
//       expect(expirationTime - afterGeneration).toBeLessThanOrEqual(expectedExpiration + 1000);
//     });

//     it('should generate unique tokens on each call', () => {
//       const token1 = TokenService.generateResetToken();
//       const token2 = TokenService.generateResetToken();
      
//       expect(token1.token).not.toBe(token2.token);
//       expect(token1.token_hash).not.toBe(token2.token_hash);
//     });

//     it('should return a Date object for expires_at', () => {
//       const result = TokenService.generateResetToken();
      
//       expect(result.expires_at).toBeInstanceOf(Date);
//     });
//   });

//   describe('storeResetToken()', () => {
//     it('should invalidate existing tokens for the user', async () => {
//       const userId = 1;
//       const tokenHash = bcrypt.hashSync('test-token', 10);
//       const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Invalidate existing
//       db.query.mockResolvedValueOnce({ rows: [{ id: 1, user_id: userId, expires_at: expiresAt, created_at: new Date() }] }); // Insert new
      
//       await TokenService.storeResetToken(userId, tokenHash, expiresAt);
      
//       // Verify invalidation query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('UPDATE password_reset_tokens SET is_used = true'),
//         [userId]
//       );
//     });

//     it('should store the new token in database', async () => {
//       const userId = 1;
//       const tokenHash = bcrypt.hashSync('test-token', 10);
//       const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Invalidate existing
//       db.query.mockResolvedValueOnce({ rows: [{ id: 1, user_id: userId, expires_at: expiresAt, created_at: new Date() }] }); // Insert new
      
//       const result = await TokenService.storeResetToken(userId, tokenHash, expiresAt);
      
//       expect(result).toHaveProperty('id');
//       expect(result).toHaveProperty('user_id', userId);
//       expect(result).toHaveProperty('expires_at');
//       expect(result).toHaveProperty('created_at');
//     });

//     it('should throw error if database query fails', async () => {
//       const userId = 1;
//       const tokenHash = bcrypt.hashSync('test-token', 10);
//       const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
//       db.query.mockRejectedValueOnce(new Error('Database error'));
      
//       await expect(TokenService.storeResetToken(userId, tokenHash, expiresAt)).rejects.toThrow('Database error');
//     });
//   });

//   describe('validateResetToken()', () => {
//     it('should return false if no token found for user', async () => {
//       const token = 'test-token';
//       const userId = 1;
      
//       db.query.mockResolvedValueOnce({ rows: [] });
      
//       const result = await TokenService.validateResetToken(token, userId);
      
//       expect(result).toBe(false);
//     });

//     it('should return false if token is expired', async () => {
//       const token = 'test-token';
//       const userId = 1;
//       const tokenHash = bcrypt.hashSync(token, 10);
//       const expiredTime = new Date(Date.now() - 1000); // 1 second ago
      
//       db.query.mockResolvedValueOnce({
//         rows: [{
//           id: 1,
//           token_hash: tokenHash,
//           expires_at: expiredTime,
//           is_used: false
//         }]
//       });
      
//       const result = await TokenService.validateResetToken(token, userId);
      
//       expect(result).toBe(false);
//     });

//     it('should return false if token hash does not match', async () => {
//       const token = 'test-token';
//       const userId = 1;
//       const wrongTokenHash = bcrypt.hashSync('wrong-token', 10);
//       const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
//       db.query.mockResolvedValueOnce({
//         rows: [{
//           id: 1,
//           token_hash: wrongTokenHash,
//           expires_at: futureTime,
//           is_used: false
//         }]
//       });
      
//       const result = await TokenService.validateResetToken(token, userId);
      
//       expect(result).toBe(false);
//     });

//     it('should return true if token is valid', async () => {
//       const token = 'test-token';
//       const userId = 1;
//       const tokenHash = bcrypt.hashSync(token, 10);
//       const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
//       db.query.mockResolvedValueOnce({
//         rows: [{
//           id: 1,
//           token_hash: tokenHash,
//           expires_at: futureTime,
//           is_used: false
//         }]
//       });
      
//       const result = await TokenService.validateResetToken(token, userId);
      
//       expect(result).toBe(true);
//     });

//     it('should return false if database query fails', async () => {
//       const token = 'test-token';
//       const userId = 1;
      
//       db.query.mockRejectedValueOnce(new Error('Database error'));
      
//       const result = await TokenService.validateResetToken(token, userId);
      
//       expect(result).toBe(false);
//     });

//     it('should query for unused tokens only', async () => {
//       const token = 'test-token';
//       const userId = 1;
//       const tokenHash = bcrypt.hashSync(token, 10);
//       const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
//       db.query.mockResolvedValueOnce({
//         rows: [{
//           id: 1,
//           token_hash: tokenHash,
//           expires_at: futureTime,
//           is_used: false
//         }]
//       });
      
//       await TokenService.validateResetToken(token, userId);
      
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('is_used = false'),
//         [userId]
//       );
//     });
//   });

//   describe('invalidateResetToken()', () => {
//     it('should mark token as used with current timestamp', async () => {
//       const userId = 1;
      
//       db.query.mockResolvedValueOnce({ rowCount: 1 });
      
//       await TokenService.invalidateResetToken(userId);
      
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('UPDATE password_reset_tokens'),
//         [userId]
//       );
      
//       const query = db.query.mock.calls[0][0];
//       expect(query).toContain('is_used = true');
//       expect(query).toContain('used_at = NOW()');
//     });

//     it('should throw error if database query fails', async () => {
//       const userId = 1;
      
//       db.query.mockRejectedValueOnce(new Error('Database error'));
      
//       await expect(TokenService.invalidateResetToken(userId)).rejects.toThrow('Database error');
//     });

//     it('should only invalidate unused tokens', async () => {
//       const userId = 1;
      
//       db.query.mockResolvedValueOnce({ rowCount: 1 });
      
//       await TokenService.invalidateResetToken(userId);
      
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('is_used = false'),
//         [userId]
//       );
//     });
//   });

//   describe('cleanupExpiredTokens()', () => {
//     it('should delete expired tokens', async () => {
//       db.query.mockResolvedValueOnce({ rowCount: 5 });
      
//       const result = await TokenService.cleanupExpiredTokens();
      
//       expect(result).toBe(5);
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('DELETE FROM password_reset_tokens')
//       );
//     });

//     it('should delete tokens expired more than 7 days ago', async () => {
//       db.query.mockResolvedValueOnce({ rowCount: 3 });
      
//       await TokenService.cleanupExpiredTokens();
      
//       const query = db.query.mock.calls[0][0];
//       expect(query).toContain('INTERVAL');
//       expect(query).toContain('7 days');
//     });

//     it('should throw error if database query fails', async () => {
//       db.query.mockRejectedValueOnce(new Error('Database error'));
      
//       await expect(TokenService.cleanupExpiredTokens()).rejects.toThrow('Database error');
//     });

//     it('should return 0 if no tokens deleted', async () => {
//       db.query.mockResolvedValueOnce({ rowCount: 0 });
      
//       const result = await TokenService.cleanupExpiredTokens();
      
//       expect(result).toBe(0);
//     });
//   });

//   describe('Integration scenarios', () => {
//     it('should complete full token lifecycle: generate -> store -> validate -> invalidate', async () => {
//       const userId = 1;
      
//       // Generate token
//       const generated = TokenService.generateResetToken();
//       expect(generated.token).toBeDefined();
//       expect(generated.token_hash).toBeDefined();
      
//       // Store token
//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // Invalidate existing
//       db.query.mockResolvedValueOnce({ rows: [{ id: 1, user_id: userId, expires_at: generated.expires_at, created_at: new Date() }] }); // Insert new
      
//       await TokenService.storeResetToken(userId, generated.token_hash, generated.expires_at);
      
//       // Validate token
//       db.query.mockResolvedValueOnce({
//         rows: [{
//           id: 1,
//           token_hash: generated.token_hash,
//           expires_at: generated.expires_at,
//           is_used: false
//         }]
//       });
      
//       const isValid = await TokenService.validateResetToken(generated.token, userId);
//       expect(isValid).toBe(true);
      
//       // Invalidate token
//       db.query.mockResolvedValueOnce({ rowCount: 1 });
      
//       await TokenService.invalidateResetToken(userId);
      
//       // Verify token is no longer valid
//       db.query.mockResolvedValueOnce({ rows: [] }); // No unused tokens found
      
//       const isValidAfterInvalidation = await TokenService.validateResetToken(generated.token, userId);
//       expect(isValidAfterInvalidation).toBe(false);
//     });

//     it('should handle multiple tokens for same user by invalidating previous ones', async () => {
//       const userId = 1;
      
//       // Generate first token
//       const token1 = TokenService.generateResetToken();
      
//       // Store first token
//       db.query.mockResolvedValueOnce({ rowCount: 0 }); // No existing tokens
//       db.query.mockResolvedValueOnce({ rows: [{ id: 1, user_id: userId, expires_at: token1.expires_at, created_at: new Date() }] });
      
//       await TokenService.storeResetToken(userId, token1.token_hash, token1.expires_at);
      
//       // Generate second token
//       const token2 = TokenService.generateResetToken();
      
//       // Store second token (should invalidate first)
//       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Invalidate first token
//       db.query.mockResolvedValueOnce({ rows: [{ id: 2, user_id: userId, expires_at: token2.expires_at, created_at: new Date() }] });
      
//       await TokenService.storeResetToken(userId, token2.token_hash, token2.expires_at);
      
//       // Verify first invalidation query was called
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('UPDATE password_reset_tokens SET is_used = true'),
//         [userId]
//       );
//     });
//   });
// });
