/**
 * User Form
 * 
 * Uses the dynamic schema-based BaseForm to render the user form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the user schema.
 */

import React, { useState } from 'react';
import { BaseForm, FormContainer } from '@framework/components/form';
import { JSONBPermissionsRenderer } from '@framework/components/jsonbfield';
import { useUsersEnhanced } from './usersStore';
import type { User } from '../../types/auth';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import authService from '../../services/authService';
import './UserForm.css';

interface UserFormProps {
  user?: User;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const users = useUsersEnhanced();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string>('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string>('');

  // Handle admin password reset
  const handleAdminResetPassword = async () => {
    if (!user?.users_id) return;

    setResetPasswordLoading(true);
    setResetPasswordError('');
    setResetPasswordSuccess('');

    try {
      await authService.adminResetPassword(parseInt(user.users_id, 10));
      setResetPasswordSuccess('Password reset link has been sent to the user');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setResetPasswordSuccess('');
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setResetPasswordError(errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Custom field renderer for permissions and password reset actions
  const renderCustomField = (
    fieldName: string,
    fieldDef: any,
    value: any,
    error: string | undefined,
    isDisabled: boolean,
    onChange: (value: any) => void
  ) => {
    // Render permissions field
    if (fieldName === 'permissions') {
      return (
        <JSONBPermissionsRenderer
          name={fieldName}
          label={fieldDef.label}
          value={value}
          error={error}
          disabled={isDisabled}
          required={fieldDef.required}
          description={fieldDef.description}
          onChange={onChange}
        />
      );
    }

    // Render password reset action buttons
    if (fieldName === 'password_reset_actions' && user?.users_id) {
      return (
        <div className="user-form__password-actions">
          {/* Error Alert */}
          {resetPasswordError && (
            <div className="user-form__alert user-form__alert--error">
              {resetPasswordError}
            </div>
          )}

          {/* Success Alert */}
          {resetPasswordSuccess && (
            <div className="user-form__alert user-form__alert--success">
              {resetPasswordSuccess}
            </div>
          )}

          {/* Password Action Buttons - Vertical Layout */}
          <div className="user-form__button-group">
            {/* Change Password Button */}
            <button
              type="button"
              className="user-form__btn user-form__btn--secondary"
              onClick={() => setShowChangePasswordModal(true)}
              disabled={loading}
            >
              🔒 Change Password
            </button>

            {/* Reset Password Button (Admin Only) */}
            <button
              type="button"
              className="user-form__btn user-form__btn--secondary"
              onClick={handleAdminResetPassword}
              disabled={loading || resetPasswordLoading}
            >
              {resetPasswordLoading ? '⏳ Sending...' : '🔑 Reset Password'}
            </button>
          </div>

          <div className="user-form__help-text">
            • <strong>Change Password:</strong> Update your own password
            <br />
            • <strong>Reset Password:</strong> Send a password reset link to the user
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <FormContainer>
      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          setShowChangePasswordModal(false);
        }}
      />

      {/* User Form */}
      <div className="form-container__content">
        <BaseForm
          schemaName="user"
          entity={user}
          store={users}
          onCancel={onCancel}
          onSubmit={onSubmit}
          className="user-form"
          loading={loading}
          excludeFields={user?.users_id ? ['passwordHash', 'lastLogin', 'password'] : ['passwordHash', 'lastLogin']}
          renderCustomField={renderCustomField}
          showTabs={true}
        />
      </div>
    </FormContainer>
  );
};

export default UserForm;
