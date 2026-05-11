import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated, user, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated as superadmin — go to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'superadmin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, user?.role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const response = await login({ email, password });
      if (response.user?.role !== 'superadmin') {
        logout();
        setError('Access denied. Admin credentials required.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: 'grey.100' }}
    >
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={1}>
            MeterIt Admin Portal
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sign in with your admin credentials
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              autoComplete="email"
              autoFocus
              disabled={submitting}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              autoComplete="current-password"
              disabled={submitting}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminLoginPage;
