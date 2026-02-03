import { useState, useEffect } from 'react';
import { ConnectionState } from '../types/connection';

interface ConnectionStatusState {
  syncDb: ConnectionState;
  remoteDb: ConnectionState;
  remoteApi: ConnectionState;
}

const CHECK_INTERVAL = 60000; // 60 seconds
const CHECK_TIMEOUT = 5000; // 5 seconds

/**
 * Custom hook to check and monitor connection status for local sync DB,
 * remote client DB, and remote API
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatusState>({
    syncDb: ConnectionState.CHECKING,
    remoteDb: ConnectionState.CHECKING,
    remoteApi: ConnectionState.CHECKING,
  });

  const checkConnection = async (
    endpoint: string,
    timeout: number = CHECK_TIMEOUT
  ): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(`Connection check failed for ${endpoint}:`, err);
      return false;
    }
  };

  const checkAllConnections = async () => {
    try {
      // Check local sync database
      const syncDbConnected = await checkConnection('/api/health/sync-db');
      setStatus((prev) => ({
        ...prev,
        syncDb: syncDbConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
      }));

      // Check remote database
      const remoteDbConnected = await checkConnection('/api/health/remote-db');
      setStatus((prev) => ({
        ...prev,
        remoteDb: remoteDbConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
      }));

      // Check remote API (Client System)
      const remoteApiConnected = await checkConnection('/api/local/sync-status');
      setStatus((prev) => ({
        ...prev,
        remoteApi: remoteApiConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
      }));
    } catch (err) {
      console.error('Error during connection checks:', err);
    }
  };

  useEffect(() => {
    // Initial check
    checkAllConnections();

    // Set up periodic checking
    const interval = setInterval(checkAllConnections, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const isAllConnected = 
    status.syncDb === ConnectionState.CONNECTED &&
    status.remoteDb === ConnectionState.CONNECTED &&
    status.remoteApi === ConnectionState.CONNECTED;

  const isRemoteSystemConnected = 
    status.remoteDb === ConnectionState.CONNECTED &&
    status.remoteApi === ConnectionState.CONNECTED;

  return {
    status,
    isAllConnected,
    isRemoteSystemConnected,
    refresh: checkAllConnections,
  };
}
