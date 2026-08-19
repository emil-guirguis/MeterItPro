import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import AppLayoutWrapper from './components/layout/AppLayoutWrapper';
import AppRoutes from './routes/AppRoutes';
import LoginPage from './pages/LoginPage';
import { setupDebugConsole } from './utils/debugConsole';

setupDebugConsole();

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <AppLayoutWrapper>
      <AppRoutes />
    </AppLayoutWrapper>
  );
}
