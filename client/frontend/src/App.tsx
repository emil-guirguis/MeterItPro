import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import AppLayoutWrapper from './components/layout/AppLayoutWrapper';
import AdminApp from './admin/AdminApp';
import AdminBanner from './components/AdminBanner';
import { prefetchAppSchemas, prefetchAppRoutes } from './utils/schemaPrefetch';
import { invalidateExpiredCache } from '@framework/components/form/utils/schemaLoader';
import { useAuth } from './hooks/useAuth';
import { setupDebugConsole } from './utils/debugConsole';
import { MeterSelectionProvider } from './contexts/MeterSelectionContext';
import { NotificationProvider } from './components/NotificationProvider';
import './App.css';

setupDebugConsole();

const appStartTime = performance.now();

function App() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminSection = location.pathname.startsWith('/admin');
  const isImpersonating = user?.isAdminView === true;

  useEffect(() => {
    console.log(`[App +${(performance.now() - appStartTime).toFixed(0)}ms] isAuthenticated=${isAuthenticated} isLoading=${isLoading}`);
  }, [isAuthenticated, isLoading]);

  // Prefetch schemas for the client portal (not needed in admin section)
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isAdminSection) {
      console.log(`[App +${(performance.now() - appStartTime).toFixed(0)}ms] Auth resolved — layout mounting, starting prefetch`);
      prefetchAppRoutes();
      prefetchAppSchemas().catch((error) => {
        console.error('[App] Schema prefetch failed:', error);
      });
    }
  }, [isAuthenticated, isLoading, isAdminSection]);

  // Periodically clean up expired schema cache entries
  useEffect(() => {
    const interval = setInterval(() => {
      const removed = invalidateExpiredCache();
      if (removed > 0) {
        console.log(`[Schema Cache] Cleaned up ${removed} expired cache entries`);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Redirect authenticated superadmin from client portal to admin portal
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'superadmin' && !isAdminSection && !isImpersonating) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, user?.role, isAdminSection, isImpersonating, navigate]);

  return (
    <NotificationProvider>
      <MeterSelectionProvider>
        {isAdminSection ? (
          <AdminApp />
        ) : (
          <>
            {isImpersonating && <AdminBanner />}
            {isAuthenticated && !isLoading ? (
              <AppLayoutWrapper>
                <AppRoutes />
              </AppLayoutWrapper>
            ) : (
              <AppRoutes />
            )}
          </>
        )}
      </MeterSelectionProvider>
    </NotificationProvider>
  );
}

export default App;
