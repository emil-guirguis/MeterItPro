import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { muiTheme } from './theme/muiTheme';
import { ErrorBoundary } from './components/ErrorBoundary';

console.log('[MUI Theme] Theme loaded:', muiTheme.palette.primary.main);

// Vite injects BASE_URL: '/' in dev, '/Synergy/' on GitHub Pages.
// React Router needs it (without trailing slash) as basename so deep
// routes resolve and <Link>/navigate emit base-prefixed URLs in prod.
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter basename={routerBasename}>
          <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);
