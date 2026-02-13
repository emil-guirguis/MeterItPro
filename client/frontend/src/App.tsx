import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { prefetchAppSchemas } from './utils/schemaPrefetch';
import { invalidateExpiredCache } from '@framework/components/form/utils/schemaLoader';
import { useAuth } from './hooks/useAuth';
import { setupDebugConsole } from './utils/debugConsole';
import { MeterSelectionProvider } from './contexts/MeterSelectionContext';
import { NotificationProvider } from './components/NotificationProvider';
import './App.css';

// Initialize debug console on app startup
setupDebugConsole();

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Prefetch schemas after user is authenticated and wait for completion
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('[App] User authenticated, starting schema prefetch...');
      prefetchAppSchemas().then(() => {
        console.log('[App] Schema prefetch complete, all schemas cached and ready');
      }).catch((error) => {
        console.error('[App] Schema prefetch failed:', error);
        // App continues to work even if prefetch fails
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
        <AppRoutes />
      </MeterSelectionProvider>
    </NotificationProvider>
  );
}

export default App;
