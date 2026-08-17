import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => {
  const queryFn = vi.fn();
  return {
    query: queryFn,
    execQuery: vi.fn((env: any, sql: string, params?: any[]) => queryFn(env, sql, params)),
    transaction: vi.fn(),
  };
});

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
    genSalt: vi.fn(),
  },
}));

vi.mock('speakeasy', () => ({
  default: {
    totp: {
      verify: vi.fn(),
    },
    generateSecret: vi.fn(),
  },
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { query, transaction } from '../db';
import { clearUserCache } from '../middleware';
import authApp from './auth';
import type { Env } from '../db';

const mockSign = vi.mocked(sign);
const mockVerify = vi.mocked(verify);
const mockBcryptCompare = vi.mocked(bcrypt.compare);
const mockBcryptHash = vi.mocked(bcrypt.hash);
const mockBcryptGenSalt = vi.mocked(bcrypt.genSalt);
const mockSpeakeasyVerify = vi.mocked(speakeasy.totp.verify);
const mockSpeakeasyGenerateSecret = vi.mocked(speakeasy.generateSecret);
const mockQuery = vi.mocked(query);
const mockTransaction = vi.mocked(transaction);

const TEST_ENV: Env = {
  JWT_SECRET: 'test-secret',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
} as any;

const SAMPLE_USER = {
  users_id: 1, name: 'Admin', email: 'admin@test.com',
  passwordhash: '$2b$10$hashedpassword',
  role: 'admin', active: true, tenant_id: 1,
  permissions: {}, locked_until: null, failed_login_attempts: 0,
};

const SAMPLE_TENANT = {
  tenant_id: 1, name: 'Test Company', url: null, street: null, street2: null,
  city: null, state: null, zip: null, country: 'US', active: true,
  api_key: 'api-key', created_at: new Date(), updated_at: new Date(),
};

function setupSign() {
  mockSign.mockResolvedValue('mock-jwt-token');
}

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearUserCache();
    setupSign();
    mockBcryptGenSalt.mockResolvedValue('salt' as any);
    mockBcryptHash.mockResolvedValue('$2b$10$newhash' as any);
  });

  describe('POST /login', () => {
    it('returns JWT tokens on successful login', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)       // find user
        .mockResolvedValueOnce({ rows: [{ locked_until: null, failed_login_attempts: 0 }] } as any) // lockout check
        .mockResolvedValueOnce({ rows: [] } as any)                   // 2FA methods
        .mockResolvedValueOnce({ rows: [] } as any)                   // reset failed attempts
        .mockResolvedValueOnce({ rows: [] } as any)                   // log auth event
        .mockResolvedValueOnce({ rows: [SAMPLE_TENANT] } as any);    // tenant lookup

      mockBcryptCompare.mockResolvedValueOnce(true as any); // password valid

      const res = await authApp.request('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'ValidPass1!' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.user.email).toBe('admin@test.com');
      expect(body.data.user.status).toBe('active');
    });

    it('returns 401 when user not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)  // user not found
        .mockResolvedValueOnce({ rows: [] } as any); // log auth event

      const res = await authApp.request('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@test.com', password: 'Pass1!' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toBe('Invalid email or password');
    });

    it('returns 401 when password is invalid', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [{ locked_until: null, failed_login_attempts: 0 }] } as any)
        .mockResolvedValueOnce({ rows: [{ failed_login_attempts: 0 }] } as any)  // increment attempts
        .mockResolvedValueOnce({ rows: [] } as any)                               // update attempts
        .mockResolvedValueOnce({ rows: [] } as any);                              // log event

      mockBcryptCompare.mockResolvedValueOnce(false as any); // password invalid

      const res = await authApp.request('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'WrongPassword' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toBe('Invalid email or password');
    });

    it('returns 401 when account is locked', async () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [{ locked_until: futureDate, failed_login_attempts: 5 }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // log event

      const res = await authApp.request('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'AnyPass1!' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toContain('locked');
    });

    it('returns 401 when account is inactive', async () => {
      const inactiveUser = { ...SAMPLE_USER, active: false };
      mockQuery
        .mockResolvedValueOnce({ rows: [inactiveUser] } as any)
        .mockResolvedValueOnce({ rows: [{ locked_until: null, failed_login_attempts: 0 }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // log event

      mockBcryptCompare.mockResolvedValueOnce(true as any);

      const res = await authApp.request('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'Pass1!' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toContain('inactive');
    });

    it('returns 400 when email is invalid', async () => {
      const res = await authApp.request('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: 'Pass1!' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
      const res = await authApp.request('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('requires 2FA when user has 2FA methods enabled', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [{ locked_until: null, failed_login_attempts: 0 }] } as any)
        .mockResolvedValueOnce({ rows: [{ method_type: 'totp' }] } as any)  // 2FA methods
        .mockResolvedValueOnce({ rows: [] } as any); // log event

      mockBcryptCompare.mockResolvedValueOnce(true as any);

      const res = await authApp.request('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'ValidPass1!' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.requires_2fa).toBe(true);
      expect(body.session_token).toBeDefined();
      expect(body.available_methods).toContain('totp');
    });
  });

  describe('POST /verify-2fa', () => {
    it('returns tokens on valid TOTP code', async () => {
      const sessionPayload = { userId: 1, tenant_id: 1, is2FASession: true };
      mockVerify.mockResolvedValueOnce(sessionPayload as any);

      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [{ secret_key: 'BASE32SECRET' }] } as any) // TOTP method
        .mockResolvedValueOnce({ rows: [] } as any) // reset failed attempts
        .mockResolvedValueOnce({ rows: [] } as any) // log event
        .mockResolvedValueOnce({ rows: [SAMPLE_TENANT] } as any); // tenant

      mockSpeakeasyVerify.mockReturnValueOnce(true);

      const res = await authApp.request('/verify-2fa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_token: 'valid-session-token',
          code: '123456',
          method: 'totp',
        }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.email).toBe('admin@test.com');
    });

    it('returns 401 when TOTP code is invalid', async () => {
      const sessionPayload = { userId: 1, tenant_id: 1, is2FASession: true };
      mockVerify.mockResolvedValueOnce(sessionPayload as any);

      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [{ secret_key: 'BASE32SECRET' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // log event

      mockSpeakeasyVerify.mockReturnValueOnce(false);

      const res = await authApp.request('/verify-2fa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_token: 'valid-session-token',
          code: 'wrong-code',
          method: 'totp',
        }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toContain('Invalid 2FA code');
    });

    it('returns 401 when session token is expired', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Token expired'));

      const res = await authApp.request('/verify-2fa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_token: 'expired-token',
          code: '123456',
          method: 'totp',
        }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });

    it('returns 400 when session_token is missing', async () => {
      const res = await authApp.request('/verify-2fa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: '123456', method: 'totp' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 400 when method is invalid', async () => {
      const res = await authApp.request('/verify-2fa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session_token: 'tok', code: '123456', method: 'invalid' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /refresh', () => {
    it('returns new tokens for a valid refresh token', async () => {
      const refreshPayload = { userId: 1, tenant_id: 1, isRefresh: true };
      mockVerify.mockResolvedValueOnce(refreshPayload as any);

      mockQuery.mockResolvedValueOnce({
        rows: [{ ...SAMPLE_USER }],
      } as any);

      const res = await authApp.request('/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'valid-refresh-token' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.user.users_id).toBe(1);
    });

    it('returns 400 when refreshToken is missing', async () => {
      const res = await authApp.request('/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 401 when refresh token is expired', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Token expired'));

      const res = await authApp.request('/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'expired-token' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });

    it('returns 401 when token is not a refresh token', async () => {
      mockVerify.mockResolvedValueOnce({ userId: 1, tenant_id: 1 } as any); // no isRefresh flag

      const res = await authApp.request('/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'access-token-not-refresh' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toContain('Invalid refresh token');
    });

    it('returns 401 when user is inactive', async () => {
      mockVerify.mockResolvedValueOnce({ userId: 1, tenant_id: 1, isRefresh: true } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...SAMPLE_USER, active: false }],
      } as any);

      const res = await authApp.request('/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'valid-refresh' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toContain('inactive');
    });
  });

  describe('POST /signup', () => {
    it('creates tenant and admin user', async () => {
      mockTransaction.mockImplementationOnce(async (_env, fn) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ tenant_id: 42 }] }) // insert tenant
            .mockResolvedValueOnce({ rows: [{ users_id: 10, email: 'boss@company.com', name: 'Boss', role: 'admin', tenant_id: 42 }] }), // insert user
        };
        return await fn(client as any);
      });

      const res = await authApp.request('/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: { name: 'Big Corp' },
          user: { name: 'Boss', email: 'boss@company.com', password: 'ValidPass1!' },
        }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.tenantId).toBe(42);
      expect(body.data.userId).toBe(10);
    });

    it('returns 400 when user email is invalid', async () => {
      const res = await authApp.request('/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: { name: 'Corp' },
          user: { name: 'Boss', email: 'not-valid', password: 'Pass1!' },
        }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 400 when company name is missing', async () => {
      const res = await authApp.request('/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: {},
          user: { name: 'Boss', email: 'boss@corp.com', password: 'Pass1!' },
        }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 409 on duplicate email', async () => {
      mockTransaction.mockRejectedValueOnce(
        Object.assign(new Error('duplicate key value violates unique constraint'), { message: 'duplicate key' })
      );

      const res = await authApp.request('/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: { name: 'Corp' },
          user: { name: 'Boss', email: 'existing@corp.com', password: 'ValidPass1!' },
        }),
      }, TEST_ENV);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.message).toContain('already exists');
    });
  });

  describe('POST /forgot-password', () => {
    it('always returns generic message for security', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any) // rate limit check
        .mockResolvedValueOnce({ rows: [] } as any);               // user not found

      const res = await authApp.request('/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@test.com' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('If an account exists');
    });

    it('returns 400 when email is invalid', async () => {
      const res = await authApp.request('/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'notanemail' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /change-password', () => {
    it('changes password when current password is correct', async () => {
      // Setup auth for protected route
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any) // auth middleware user lookup
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any) // get user with hash
        .mockResolvedValueOnce({ rows: [] } as any) // update password
        .mockResolvedValueOnce({ rows: [] } as any); // log event

      // current password valid, new != current
      mockBcryptCompare
        .mockResolvedValueOnce(true as any)  // current password valid
        .mockResolvedValueOnce(false as any); // new != current

      const res = await authApp.request('/change-password', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'OldPass1!',
          newPassword: 'NewPass1!',
          confirmPassword: 'NewPass1!',
        }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('returns 401 when current password is wrong', async () => {
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // log event

      mockBcryptCompare.mockResolvedValueOnce(false as any);

      const res = await authApp.request('/change-password', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'WrongOldPass',
          newPassword: 'NewPass1!',
          confirmPassword: 'NewPass1!',
        }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });

    it('returns 400 when passwords do not match', async () => {
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // log event

      const res = await authApp.request('/change-password', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'OldPass1!',
          newPassword: 'NewPass1!',
          confirmPassword: 'DifferentPass1!',
        }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toContain('do not match');
    });

    it('returns 400 when new password fails validation (too weak)', async () => {
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // log event

      mockBcryptCompare.mockResolvedValueOnce(true as any); // current password valid

      const res = await authApp.request('/change-password', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'OldPass1!',
          newPassword: 'weak',
          confirmPassword: 'weak',
        }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.errors).toBeDefined();
    });

    it('returns 401 when not authenticated', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Invalid token'));

      const res = await authApp.request('/change-password', {
        method: 'POST',
        headers: { authorization: 'Bearer bad-token' },
        body: JSON.stringify({
          currentPassword: 'Old1!',
          newPassword: 'New1!',
          confirmPassword: 'New1!',
        }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /verify', () => {
    it('returns user profile when token is valid', async () => {
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery.mockResolvedValue({ rows: [SAMPLE_USER] } as any);

      const res = await authApp.request('/verify', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.user.users_id).toBe(1);
      expect(body.data.user.permissions).toBeDefined();
    });

    it('returns 401 when not authenticated', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Invalid token'));

      const res = await authApp.request('/verify', {
        headers: { authorization: 'Bearer bad-token' },
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /2fa/setup', () => {
    it('returns TOTP secret for totp method', async () => {
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any) // auth
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any); // get user

      mockSpeakeasyGenerateSecret.mockReturnValueOnce({
        base32: 'BASE32SECRET',
        otpauth_url: 'otpauth://totp/MeterItPro',
      } as any);

      const res = await authApp.request('/2fa/setup', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ method: 'totp' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.secret).toBe('BASE32SECRET');
      expect(body.data.otpauth_url).toBeDefined();
    });

    it('returns 400 for invalid method', async () => {
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery.mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any);

      const res = await authApp.request('/2fa/setup', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ method: 'invalid_method' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Invalid token'));

      const res = await authApp.request('/2fa/setup', {
        method: 'POST',
        headers: { authorization: 'Bearer bad-token' },
        body: JSON.stringify({ method: 'totp' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /2fa/disable', () => {
    it('disables 2FA when password is correct', async () => {
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)  // auth
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)  // get user with hash
        .mockResolvedValueOnce({ rows: [{ method_type: 'totp' }] } as any) // disable update
        .mockResolvedValueOnce({ rows: [] } as any)             // delete backup codes
        .mockResolvedValueOnce({ rows: [] } as any);            // log event

      mockBcryptCompare.mockResolvedValueOnce(true as any);

      const res = await authApp.request('/2fa/disable', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ method: 'totp', password: 'ValidPass1!' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('returns 401 when password is wrong', async () => {
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [SAMPLE_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // log event

      mockBcryptCompare.mockResolvedValueOnce(false as any);

      const res = await authApp.request('/2fa/disable', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ method: 'totp', password: 'WrongPass' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /2fa/methods', () => {
    it('returns list of enabled 2FA methods', async () => {
      mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 } as any);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ method_type: 'totp', is_enabled: true, created_at: new Date() }],
        } as any);

      const res = await authApp.request('/2fa/methods', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.methods).toHaveLength(1);
      expect(body.data.methods[0].type).toBe('totp');
    });

    it('returns 401 when not authenticated', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Invalid token'));

      const res = await authApp.request('/2fa/methods', {
        headers: { authorization: 'Bearer bad-token' },
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });
  });
});
