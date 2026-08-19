import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { lightTheme } from '@framework/theme/materialDesign3Theme';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

// Subpath deploy: BASE_URL is set by vite `base` (e.g. "/Synergy/TBWCPortal/") so the
// router must scope routes under it. Strip the trailing slash React Router doesn't want;
// at root ("/") this collapses to undefined = default "/".
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
