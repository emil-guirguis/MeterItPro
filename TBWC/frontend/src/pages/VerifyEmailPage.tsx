import { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { consumeVerifyToken, type VerifyStatus } from '../services/verifyService';

/**
 * Landing page for the 90-day re-verification link mailed to locked-out
 * reps (see TBWC/api/worker/reverification.ts). Reached with no session —
 * App.tsx renders this ahead of the login gate for the /verify path.
 */
export default function VerifyEmailPage() {
  const [status, setStatus] = useState<VerifyStatus | 'checking' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      setError('Missing verification token.');
      return;
    }
    consumeVerifyToken(token)
      .then(setStatus)
      .catch((e: Error) => {
        setStatus('error');
        setError(e.message);
      });
  }, []);

  const content = () => {
    if (status === 'checking') return <CircularProgress />;
    if (status === 'ok') {
      return (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            Email verified — your account is unlocked.
          </Alert>
          <Button href="./" variant="contained" fullWidth>
            Go to sign in
          </Button>
        </>
      );
    }
    if (status === 'expired') {
      return (
        <Alert severity="warning">
          This verification link has expired. Contact your administrator for a new one.
        </Alert>
      );
    }
    return (
      <Alert severity="error">
        {status === 'invalid' ? 'This verification link is invalid.' : error || 'Verification failed.'}
      </Alert>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Verify Email
        </Typography>
        <Box sx={{ mt: 2 }}>{content()}</Box>
      </Paper>
    </Box>
  );
}
