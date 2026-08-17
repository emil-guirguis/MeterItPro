# Password Reset Section Restored to Security Tab

## Problem
The password reset action buttons (Change Password and Reset Password) were not visible in the Security tab. The issue was that the schema structure was incorrect - the password reset fields were in the wrong section.

## Root Cause
The `password_reset_actions` field was defined in the "Access Control" section instead of the "Password Reset" section. Additionally, the `role` and `permissions` fields were missing from the "Access Control" section.

## Solution
Fixed the schema structure in `UserWithSchema.js`:

1. **Reorganized Security tab sections**:
   - **Access Control section** (order: 1):
     - `role` field (enum select)
     - `permissions` field (JSON)
   - **Password Reset section** (order: 2):
     - `password_reset_actions` field (custom field for buttons)
     - `password_reset_token` field (read-only)
     - `password_reset_expires_at` field (read-only)

2. **Updated custom field renderer** (`UserForm.tsx`):
   - Extended `renderCustomField` to handle `password_reset_actions` field
   - Renders two buttons vertically:
     - **Change Password**: Opens modal to change user's own password
     - **Reset Password**: Sends password reset link to user (admin action)
   - Includes error/success alerts for feedback
   - Includes helper text explaining each button's purpose
   - Only renders when editing an existing user (has `users_id`)

## Result
- Password reset buttons now appear in the Security tab under the Password Reset section
- Buttons are displayed vertically as requested
- Buttons are properly integrated with the form's tab structure
- Maintains all existing functionality (Change Password modal, admin reset, error handling)

## Files Modified
- `client/backend/src/models/UserWithSchema.js` - Fixed schema structure and added password_reset_actions field
- `MeterItPro/frontend/src/features/users/UserForm.tsx` - Updated custom field renderer

## Testing
- Verify buttons appear in Security tab > Password Reset section when editing a user
- Verify buttons are displayed vertically
- Verify Change Password button opens modal
- Verify Reset Password button sends reset link
- Verify error/success messages display correctly
- Verify role and permissions fields appear in Access Control section
