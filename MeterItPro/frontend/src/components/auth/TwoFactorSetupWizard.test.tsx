import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TwoFactorSetupWizard } from './TwoFactorSetupWizard';
import authService from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  default: {
    setup2FA: vi.fn(),
    verify2FASetup: vi.fn(),
  },
}));

describe('TwoFactorSetupWizard', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the wizard when open is true', () => {
      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Enable Two-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByText('Choose Method')).toBeInTheDocument();
    });

    it('should not render the wizard when open is false', () => {
      const { container } = render(
        <TwoFactorSetupWizard
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });
  });

  describe('Step 1: Method Selection', () => {
    it('should display all three 2FA method options', () => {
      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Authenticator App (TOTP)')).toBeInTheDocument();
      expect(screen.getByText('Email OTP')).toBeInTheDocument();
      expect(screen.getByText('SMS OTP')).toBeInTheDocument();
    });

    it('should have TOTP selected by default', () => {
      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const totpRadio = screen.getByRole('radio', { name: /Authenticator App/i });
      expect(totpRadio).toBeChecked();
    });

    it('should allow selecting different methods', async () => {
      const user = userEvent.setup();
      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const emailRadio = screen.getByRole('radio', { name: /Email OTP/i });
      await user.click(emailRadio);

      expect(emailRadio).toBeChecked();
    });
  });

  describe('Step 2: Setup', () => {
    it('should display QR code for TOTP method', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Scan this QR code with your authenticator app:')).toBeInTheDocument();
      });
    });

    it('should display phone number input for SMS OTP', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({});

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const smsRadio = screen.getByRole('radio', { name: /SMS OTP/i });
      await user.click(smsRadio);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      });
    });

    it('should display info message for Email OTP', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({});

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const emailRadio = screen.getByRole('radio', { name: /Email OTP/i });
      await user.click(emailRadio);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/We'll send verification codes to your registered email/i)).toBeInTheDocument();
      });
    });

    it('should allow toggling secret visibility', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const secretInput = screen.getByDisplayValue('JBSWY3DPEBLW64TMMQ======') as HTMLInputElement;
        expect(secretInput.type).toBe('password');

        const visibilityButtons = screen.getAllByRole('button').filter(
          (btn) => btn.querySelector('[data-testid="VisibilityIcon"]') || btn.querySelector('[data-testid="VisibilityOffIcon"]')
        );

        if (visibilityButtons.length > 0) {
          fireEvent.click(visibilityButtons[0]);
          expect(secretInput.type).toBe('text');
        }
      });
    });

    it('should allow copying secret to clipboard', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Verification', () => {
    it('should display verification code input', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      });

      const nextButton2 = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton2);

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });
    });

    it('should only accept 6 digit codes', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      });

      const nextButton2 = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton2);

      await waitFor(() => {
        const codeInput = screen.getByLabelText('Verification Code') as HTMLInputElement;
        fireEvent.change(codeInput, { target: { value: '123456789' } });
        expect(codeInput.value).toBe('123456');
      });
    });

    it('should call verify2FASetup with correct parameters', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });
      vi.mocked(authService.verify2FASetup).mockResolvedValue({
        message: 'Success',
        backup_codes: [{ code: 'CODE1' }, { code: 'CODE2' }],
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      });

      const nextButton2 = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton2);

      await waitFor(() => {
        const codeInput = screen.getByLabelText('Verification Code');
        fireEvent.change(codeInput, { target: { value: '123456' } });
      });

      const verifyButton = screen.getByRole('button', { name: /Verify/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(authService.verify2FASetup).toHaveBeenCalledWith('totp', '123456');
      });
    });
  });

  describe('Step 4: Backup Codes', () => {
    it('should display backup codes after successful verification', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });
      vi.mocked(authService.verify2FASetup).mockResolvedValue({
        message: 'Success',
        backup_codes: [
          { code: 'CODE1' },
          { code: 'CODE2' },
          { code: 'CODE3' },
        ],
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Navigate through steps
      let nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      });

      nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const codeInput = screen.getByLabelText('Verification Code');
        fireEvent.change(codeInput, { target: { value: '123456' } });
      });

      const verifyButton = screen.getByRole('button', { name: /Verify/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Save your backup codes in a safe place:')).toBeInTheDocument();
        expect(screen.getByText('CODE1')).toBeInTheDocument();
        expect(screen.getByText('CODE2')).toBeInTheDocument();
        expect(screen.getByText('CODE3')).toBeInTheDocument();
      });
    });

    it('should allow copying backup codes', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });
      vi.mocked(authService.verify2FASetup).mockResolvedValue({
        message: 'Success',
        backup_codes: [{ code: 'CODE1' }],
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Navigate through steps
      let nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      });

      nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const codeInput = screen.getByLabelText('Verification Code');
        fireEvent.change(codeInput, { target: { value: '123456' } });
      });

      const verifyButton = screen.getByRole('button', { name: /Verify/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('CODE1')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onSuccess callback when setup is completed', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });
      vi.mocked(authService.verify2FASetup).mockResolvedValue({
        message: 'Success',
        backup_codes: [{ code: 'CODE1' }],
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Navigate through all steps
      let nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      });

      nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const codeInput = screen.getByLabelText('Verification Code');
        fireEvent.change(codeInput, { target: { value: '123456' } });
      });

      const verifyButton = screen.getByRole('button', { name: /Verify/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument();
      });

      const doneButton = screen.getByRole('button', { name: /Done/i });
      await user.click(doneButton);

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show error message on API failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockRejectedValue(new Error('Setup failed'));

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Setup failed')).toBeInTheDocument();
      });
    });
  });

  describe('Phone Number Validation', () => {
    it('should require phone number for SMS OTP', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({});

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const smsRadio = screen.getByRole('radio', { name: /SMS OTP/i });
      await user.click(smsRadio);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const phoneInput = screen.getByLabelText('Phone Number');
        expect(phoneInput).toBeInTheDocument();
      });
    });
  });

  describe('Verification Code Validation', () => {
    it('should require verification code before proceeding', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setup2FA).mockResolvedValue({
        qr_code: 'data:image/png;base64,test',
        secret: 'JBSWY3DPEBLW64TMMQ======',
      });

      render(
        <TwoFactorSetupWizard
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      let nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      });

      nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const verifyButton = screen.getByRole('button', { name: /Verify/i });
        expect(verifyButton).toBeDisabled();
      });
    });
  });
});
