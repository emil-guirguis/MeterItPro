import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TwoFactorVerificationModal } from './TwoFactorVerificationModal';
import authService from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  default: {
    verify2FA: vi.fn(),
  },
}));

describe('TwoFactorVerificationModal', () => {
  const mockOnSuccess = vi.fn();
  const mockOnClose = vi.fn();
  const mockSessionToken = 'test-session-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TOTP Method', () => {
    it('should display TOTP method label and description', () => {
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Authenticator App')).toBeInTheDocument();
      expect(screen.getByText('Enter the 6-digit code from your authenticator app')).toBeInTheDocument();
    });

    it('should accept only numeric input for code', async () => {
      const user = userEvent.setup();
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      const codeInput = screen.getByPlaceholderText('000000') as HTMLInputElement;
      await user.type(codeInput, '123abc456');

      expect(codeInput.value).toBe('123456');
    });

    it('should limit code input to 6 digits', async () => {
      const user = userEvent.setup();
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      const codeInput = screen.getByPlaceholderText('000000') as HTMLInputElement;
      await user.type(codeInput, '1234567890');

      expect(codeInput.value).toBe('123456');
    });

    it('should verify code successfully', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = { token: 'test-token', user: { id: 1 } };
      (authService.verify2FA as any).mockResolvedValue(mockAuthResponse);

      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '123456');

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(authService.verify2FA).toHaveBeenCalledWith(mockSessionToken, '123456');
        expect(mockOnSuccess).toHaveBeenCalledWith(mockAuthResponse);
      });
    });

    it('should display error on verification failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid code';
      (authService.verify2FA as any).mockRejectedValue(new Error(errorMessage));

      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '123456');

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Email OTP Method', () => {
    it('should display email OTP method label and description', () => {
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="email_otp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Enter the 6-digit code sent to your email')).toBeInTheDocument();
    });

    it('should display resend code button for email OTP', () => {
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="email_otp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /resend code/i })).toBeInTheDocument();
    });
  });

  describe('SMS OTP Method', () => {
    it('should display SMS OTP method label and description', () => {
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="sms_otp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('SMS')).toBeInTheDocument();
      expect(screen.getByText('Enter the 6-digit code sent to your phone')).toBeInTheDocument();
    });

    it('should display resend code button for SMS OTP', () => {
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="sms_otp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /resend code/i })).toBeInTheDocument();
    });
  });

  describe('Backup Code', () => {
    it('should toggle to backup code input', async () => {
      const user = userEvent.setup();
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      const backupCodeLink = screen.getByRole('button', { name: /use backup code/i });
      await user.click(backupCodeLink);

      expect(screen.getByPlaceholderText('XXXX-XXXX-XXXX')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /use verification code instead/i })).toBeInTheDocument();
    });

    it('should verify backup code successfully', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = { token: 'test-token', user: { id: 1 } };
      (authService.verify2FA as any).mockResolvedValue(mockAuthResponse);

      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      const backupCodeLink = screen.getByRole('button', { name: /use backup code/i });
      await user.click(backupCodeLink);

      const backupCodeInput = screen.getByPlaceholderText('XXXX-XXXX-XXXX');
      await user.type(backupCodeInput, 'ABCD-EFGH-IJKL');

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(authService.verify2FA).toHaveBeenCalledWith(mockSessionToken, 'ABCD-EFGH-IJKL');
        expect(mockOnSuccess).toHaveBeenCalledWith(mockAuthResponse);
      });
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable verify button when code is incomplete', () => {
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      expect(verifyButton).toBeDisabled();
    });

    it('should enable verify button when code is complete', async () => {
      const user = userEvent.setup();
      render(
        <TwoFactorVerificationModal
          open={true}
          sessionToken={mockSessionToken}
          method="totp"
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
        />
      );

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '123456');

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      expect(verifyButton).not.toBeDisabled();
    });
  });
});
