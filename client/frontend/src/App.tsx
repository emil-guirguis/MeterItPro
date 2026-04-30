import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import AppLayoutWrapper from './components/layout/AppLayoutWrapper';
import { prefetchAppSchemas, prefetchAppRoutes } from './utils/schemaPrefetch';
import { invalidateExpiredCache } from '@framework/components/form/utils/schemaLoader';
import { useAuth } from './hooks/useAuth';
import { setupDebugConsole } from './utils/debugConsole';
import { MeterSelectionProvider } from './contexts/MeterSelectionContext';
import { NotificationProvider } from './components/NotificationProvider';
import './App.css';

// Initialize debug console on app startup
setupDebugConsole();

const appStartTime = performance.now();

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log(`[App +${(performance.now() - appStartTime).toFixed(0)}ms] isAuthenticated=${isAuthenticated} isLoading=${isLoading}`);
  }, [isAuthenticated, isLoading]);

  // Prefetch schemas and route chunks after auth resolves
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log(`[App +${(performance.now() - appStartTime).toFixed(0)}ms] Auth resolved — layout mounting, starting prefetch`);
      prefetchAppRoutes();
      prefetchAppSchemas().catch((error) => {
        console.error('[App] Schema prefetch failed:', error);
      });
    }
  }, [isAuthenticated, isLoading]);

  // Periodically clean up expired cache entries (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const removed = invalidateExpiredCache();
      if (removed > 0) {
        console.log(`[Schema Cache] Cleaned up ${removed} expired cache entries`);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationProvider>
      <MeterSelectionProvider>
        {/* Only show layout for authenticated routes */}
        {isAuthenticated && !isLoading ? (
          <AppLayoutWrapper>
            <AppRoutes />
          </AppLayoutWrapper>
        ) : (
          <AppRoutes />
        )}
      </MeterSelectionProvider>
    </NotificationProvider>
  );
}

export default App;
