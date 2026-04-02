import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TwoFactorManagementPage from './TwoFactorManagementPage';
import authService from '../../services/authService';

// Mock authService
vi.mock('../../services/authService', () => ({
  __esModule: true,
  default: {
    get2FAMethods: vi.fn(),
    disable2FA: vi.fn(),
    regenerateBackupCodes: vi.fn(),
  },
}));

// Mock useTheme and useMediaQuery
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
        background: { default: '#fafafa' },
      },
      breakpoints: {
        down: () => false,
      },
    }),
    useMediaQuery: () => false,
  };
});

const mockAuthService = authService as any;

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <TwoFactorManagementPage />
    </BrowserRouter>
  );
};

describe('TwoFactorManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page title', async () => {
    mockAuthService.get2FAMethods.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    });
  });

  it('should display loading state initially', () => {
    mockAuthService.get2FAMethods.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display enabled 2FA methods', async () => {
    const mockMethods = [
      {
        type: 'totp',
        method_type: 'totp',
        is_enabled: true,
        created_at: '2025-01-08T00:00:00Z',
      },
      {
        type: 'email_otp',
        method_type: 'email_otp',
        is_enabled: true,
        created_at: '2025-01-08T00:00:00Z',
      },
    ];

    mockAuthService.get2FAMethods.mockResolvedValue(mockMethods);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Authenticator App (TOTP)')).toBeInTheDocument();
      expect(screen.getByText('Email OTP')).toBeInTheDocument();
    });
  });

  it('should display message when no methods are enabled', async () => {
    mockAuthService.get2FAMethods.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No 2FA methods enabled/i)).toBeInTheDocument();
    });
  });

  it('should open disable dialog when disable button is clicked', async () => {
    const mockMethods = [
      {
        type: 'totp',
        method_type: 'totp',
        is_enabled: true,
        created_at: '2025-01-08T00:00:00Z',
      },
    ];

    mockAuthService.get2FAMethods.mockResolvedValue(mockMethods);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Authenticator App (TOTP)')).toBeInTheDocument();
    });

    const disableButtons = screen.getAllByRole('button', { name: /Disable/i });
    fireEvent.click(disableButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/To disable this authentication method/i)).toBeInTheDocument();
    });
  });

  it('should disable 2FA method when password is provided', async () => {
    const mockMethods = [
      {
        type: 'totp',
        method_type: 'totp',
        is_enabled: true,
        created_at: '2025-01-08T00:00:00Z',
      },
    ];

    mockAuthService.get2FAMethods.mockResolvedValue(mockMethods);
    mockAuthService.disable2FA.mockResolvedValue({ message: 'Disabled' });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Authenticator App (TOTP)')).toBeInTheDocument();
    });

    const disableButtons = screen.getAllByRole('button', { name: /Disable/i });
    fireEvent.click(disableButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/To disable this authentication method/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Password');
    await userEvent.type(passwordInput, 'testpassword123');

    const confirmButton = screen.getByRole('button', { name: /Disable/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockAuthService.disable2FA).toHaveBeenCalledWith('totp', 'testpassword123');
    });
  });

  it('should display error message when disable fails', async () => {
    const mockMethods = [
      {
        type: 'totp',
        method_type: 'totp',
        is_enabled: true,
        created_at: '2025-01-08T00:00:00Z',
      },
    ];

    mockAuthService.get2FAMethods.mockResolvedValue(mockMethods);
    mockAuthService.disable2FA.mockRejectedValue(new Error('Invalid password'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Authenticator App (TOTP)')).toBeInTheDocument();
    });

    const disableButtons = screen.getAllByRole('button', { name: /Disable/i });
    fireEvent.click(disableButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/To disable this authentication method/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Password');
    await userEvent.type(passwordInput, 'wrongpassword');

    const confirmButton = screen.getByRole('button', { name: /Disable/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });
  });

  it('should display backup codes section when TOTP is enabled', async () => {
    const mockMethods = [
      {
        type: 'totp',
        method_type: 'totp',
        is_enabled: true,
        created_at: '2025-01-08T00:00:00Z',
      },
    ];

    mockAuthService.get2FAMethods.mockResolvedValue(mockMethods);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Backup Codes')).toBeInTheDocument();
    });
  });

  it('should open regenerate dialog when regenerate button is clicked', async () => {
    const mockMethods = [
      {
        type: 'totp',
        method_type: 'totp',
        is_enabled: true,
        created_at: '2025-01-08T00:00:00Z',
      },
    ];

    mockAuthService.get2FAMethods.mockResolvedValue(mockMethods);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Backup Codes')).toBeInTheDocument();
    });

    const regenerateButton = screen.getByRole('button', { name: /Regenerate Backup Codes/i });
    fireEvent.click(regenerateButton);

    await waitFor(() => {
      expect(screen.getByText(/To regenerate your backup codes/i)).toBeInTheDocument();
    });
  });

  it('should regenerate backup codes when password is provided', async () => {
    const mockMethods = [
      {
        type: 'totp',
        method_type: 'totp',
        is_enabled: true,
        created_at: '2025-01-08T00:00:00Z',
      },
    ];

    mockAuthService.get2FAMethods.mockResolvedValue(mockMethods);
    mockAuthService.regenerateBackupCodes.mockResolvedValue({
      backup_codes: [
        { code: 'CODE1' },
        { code: 'CODE2' },
      ],
    });

    // Mock alert
    global.alert = vi.fn();

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Backup Codes')).toBeInTheDocument();
    });

    const regenerateButton = screen.getByRole('button', { name: /Regenerate Backup Codes/i });
    fireEvent.click(regenerateButton);

    await waitFor(() => {
      expect(screen.getByText(/To regenerate your backup codes/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Password');
    await userEvent.type(passwordInput, 'testpassword123');

    const confirmButton = screen.getByRole('button', { name: /Regenerate/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockAuthService.regenerateBackupCodes).toHaveBeenCalledWith('testpassword123');
    });
  });

  it('should display success message after successful action', async () => {
    const mockMethods = [
      {
        type: 'totp',
        method_type: 'totp',
        is_enabled: true,
        created_at: '2025-01-08T00:00:00Z',
      },
    ];

    mockAuthService.get2FAMethods.mockResolvedValue(mockMethods);
    mockAuthService.disable2FA.mockResolvedValue({ message: 'Disabled' });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Authenticator App (TOTP)')).toBeInTheDocument();
    });

    const disableButtons = screen.getAllByRole('button', { name: /Disable/i });
    fireEvent.click(disableButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/To disable this authentication method/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Password');
    await userEvent.type(passwordInput, 'testpassword123');

    const confirmButton = screen.getByRole('button', { name: /Disable/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/has been disabled/i)).toBeInTheDocument();
    });
  });
});
