import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { tokenStorage } from '../utils/tokenStorage';
import { authService } from '../services/authService';

const AdminBanner: React.FC = () => {
  const { user } = useAuth();

  if (!user?.isAdminView) return null;

  const handleExit = () => {
    const backupRaw = sessionStorage.getItem('admin_portal_backup');
    if (backupRaw) {
      try {
        const backup = JSON.parse(backupRaw);
        const remainingSecs = Math.max(60, Math.floor((backup.expiresAt - Date.now()) / 1000));
        authService.storeTokens(backup.token, backup.refreshToken || '', remainingSecs, backup.rememberMe);
        sessionStorage.removeItem('admin_portal_backup');
        window.location.href = '/admin/clients';
        return;
      } catch {
        sessionStorage.removeItem('admin_portal_backup');
      }
    }
    // Fallback: clear and go to admin login
    tokenStorage.clearTokens();
    window.location.href = '/admin/login';
  };

  return (
    <Box
      sx={{
        backgroundColor: 'warning.main',
        color: 'warning.contrastText',
        px: 3,
        py: 0.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        zIndex: 1300,
        position: 'sticky',
        top: 0,
      }}
    >
      <Typography variant="body2" fontWeight="medium">
        Admin View — viewing as: <strong>{user.adminViewTenantName || `Tenant ${user.client}`}</strong>
      </Typography>
      <Button
        size="small"
        variant="outlined"
        onClick={handleExit}
        sx={{
          color: 'inherit',
          borderColor: 'currentColor',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' },
        }}
      >
        Exit Admin View
      </Button>
    </Box>
  );
};

export default AdminBanner;
