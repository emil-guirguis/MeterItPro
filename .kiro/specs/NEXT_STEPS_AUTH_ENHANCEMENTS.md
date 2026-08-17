# Next Steps: Authentication Enhancements Implementation

## Phase 1: Backend Completion (Current Phase)

### 1. Update Login Endpoint with 2FA Support
**File**: `client/backend/src/routes/auth.js`

The login endpoint needs to be updated to:
1. Check if user has 2FA enabled
2. If 2FA enabled, generate temporary session and return 2FA challenge
3. If 2FA disabled, create full session as normal
4. Implement account lockout after 5 failed attempts (15 minutes)
5. Log all login attempts

**Key Changes**:
- After password validation, check `user_2fa_methods` table
- If 2FA methods exist, return temporary token with `requires_2fa: true`
- Track failed login attempts in `users.failed_login_attempts`
- Set `users.locked_until` for lockout

### 2. Create 2FA Verification Endpoint
**File**: `client/backend/src/routes/auth-enhanced.js` (add new endpoint)

Create `POST /api/auth/verify-2fa` endpoint:
- Accept temporary session token and 2FA code
- Validate code against enabled 2FA methods (TOTP, Email OTP, SMS OTP, backup codes)
- Support any valid code from any enabled method
- Create full session on success
- Implement rate limiting (3 attempts, 15-minute lockout)

### 3. Create Admin Password Reset Endpoint
**File**: `client/backend/src/routes/users.js` (add new endpoint)

Create `POST /api/users/:id/reset-password` endpoint:
- Admin-only endpoint (check permissions)
- Generate reset token
- Send email to user with reset link
- Log the admin action

### 4. Create Email Templates
**File**: `client/backend/src/services/EmailService.js` (add methods)

Add email sending methods:
- `sendPasswordResetEmail()` - Send password reset link
- `send2FAEmailOTP()` - Send 6-digit email OTP
- `send2FASMSCode()` - Send 6-digit SMS code (if SMS provider configured)

### 5. Update Login Endpoint to Send 2FA Codes
**File**: `client/backend/src/routes/auth.js` (update login endpoint)

After 2FA check:
- If Email OTP enabled, generate and send code
- If SMS OTP enabled, generate and send code
- If TOTP enabled, don't send anything (user has authenticator app)

## Phase 2: Frontend Implementation

### 1. Create ChangePasswordModal Component
**File**: `MeterItPro/frontend/src/components/auth/ChangePasswordModal.tsx`

Features:
- Current password input (password type)
- New password input with strength indicator
- Confirm password input
- Password requirements checklist (real-time validation)
- Submit and Cancel buttons
- Error/success messages
- Call `POST /api/auth/change-password`

### 2. Create ForgotPasswordPage Component
**File**: `MeterItPro/frontend/src/pages/ForgotPasswordPage.tsx`

Features:
- Email input field
- Submit button
- Generic success message
- Link back to login
- Call `POST /api/auth/forgot-password`

### 3. Create PasswordResetPage Component
**File**: `MeterItPro/frontend/src/pages/PasswordResetPage.tsx`

Features:
- Extract token from URL query parameter
- Validate token on page load
- New password input with strength indicator
- Confirm password input
- Password requirements checklist
- Submit button
- Error handling for expired/invalid tokens
- Call `POST /api/auth/reset-password`

### 4. Create 2FASetupWizard Component
**File**: `MeterItPro/frontend/src/components/auth/2FASetupWizard.tsx`

Features:
- Step 1: Choose method (TOTP/Email/SMS)
- Step 2: Display QR code and secret (for TOTP) or phone verification (for SMS)
- Step 3: Verify setup with code
- Step 4: Display and save backup codes (for TOTP)
- Completion message
- Call `POST /api/auth/2fa/setup` and `POST /api/auth/2fa/verify-setup`

### 5. Create 2FAVerificationModal Component
**File**: `MeterItPro/frontend/src/components/auth/2FAVerificationModal.tsx`

Features:
- Display method (TOTP/Email/SMS)
- Code input field (6 digits)
- Resend code button (for Email/SMS)
- Backup code option
- Submit button
- Error handling and retry limits
- Call `POST /api/auth/verify-2fa`

### 6. Create 2FAManagementPage Component
**File**: `MeterItPro/frontend/src/pages/2FAManagementPage.tsx`

Features:
- Display all enabled 2FA methods
- Display disable button for each method
- Display regenerate backup codes button
- Call `GET /api/auth/2fa/methods`, `POST /api/auth/2fa/disable`, `POST /api/auth/2fa/regenerate-backup-codes`

### 7. Update LoginForm Component
**File**: `MeterItPro/frontend/src/components/auth/LoginForm.tsx`

Changes:
- Add "Forgot Password?" link
- Integrate 2FA verification modal
- Display 2FA challenge when required
- Handle 2FA verification flow
- Show 2FA verification modal when `requires_2fa: true`

### 8. Update UserForm Component
**File**: `MeterItPro/frontend/src/features/users/UserForm.tsx`

Changes:
- Add "Change Password" button (for current user)
- Add "Reset Password" button (admin only)
- Integrate ChangePasswordModal
- Call `POST /api/users/:id/reset-password` for admin reset

## Phase 3: Testing

### 1. Unit Tests
- PasswordValidator tests
- TokenService tests
- TwoFactorService tests
- AuthLoggingService tests

### 2. Property-Based Tests
- Property 1: Password Strength Validation
- Property 2: Password Change Atomicity
- Property 3: Reset Token Expiration
- Property 4: Reset Token Single Use
- Property 5: TOTP Code Validation
- Property 6: Backup Code Single Use
- Property 7: OTP Code Expiration
- Property 8: OTP Rate Limiting
- Property 9: 2FA Session Creation
- Property 10: Login Audit Trail
- Property 11: Password Reset Rate Limiting
- Property 12: Multiple 2FA Methods

### 3. Integration Tests
- Full login flow with 2FA
- Password change flow
- Password reset flow
- 2FA setup and management
- Account lockout after failed attempts

## Implementation Order

1. **Backend First** (Recommended):
   - Update login endpoint with 2FA support
   - Create 2FA verification endpoint
   - Create admin password reset endpoint
   - Create email templates
   - Test with Postman/curl

2. **Frontend Second**:
   - Update LoginForm with 2FA modal
   - Create ForgotPasswordPage
   - Create PasswordResetPage
   - Create ChangePasswordModal
   - Create 2FA components
   - Test end-to-end

3. **Testing Last**:
   - Write unit tests
   - Write property-based tests
   - Write integration tests

## Key Files to Reference

- Spec: `.kiro/specs/authentication-enhancements/requirements.md`
- Design: `.kiro/specs/authentication-enhancements/design.md`
- Tasks: `.kiro/specs/authentication-enhancements/tasks.md`
- Implementation Progress: `MeterItPro/AUTHENTICATION_ENHANCEMENTS_IMPLEMENTATION.md`

## Database Migration

Before running the backend, apply the database migration:

```bash
psql -U postgres -d meteritpro -f client/backend/migrations/002-auth-enhancements.sql
```

Or if using the migration runner:

```bash
npm run db:migrate
```

## Testing the Backend

Once the login endpoint is updated, test with:

```bash
# Test login without 2FA
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'

# Test password change
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"currentPassword":"Password123!","newPassword":"NewPassword123!","confirmPassword":"NewPassword123!"}'

# Test forgot password
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Test 2FA setup
curl -X POST http://localhost:3001/api/auth/2fa/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"method":"totp"}'
```

## Notes

- All endpoints include proper error handling and validation
- Services are modular and can be tested independently
- Rate limiting is implemented at the service level
- Authentication logging is comprehensive for audit trail
- All passwords are hashed with bcrypt (10 salt rounds)
- All tokens are cryptographically secure and hashed before storage
