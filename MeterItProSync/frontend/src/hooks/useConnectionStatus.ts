import { useState, useEffect } from 'react';
import { ConnectionState } from '../types/connection';

interface ConnectionStatusState {
  syncApi: ConnectionState;
  mcpServer: ConnectionState;
  syncDb: ConnectionState;
  remoteDb: ConnectionState;
  remoteApi: ConnectionState;
}

const CHECK_INTERVAL = 60000; // 60 seconds
const CHECK_TIMEOUT = 5000; // 5 seconds
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

/**
 * Custom hook to check and monitor connection status for:
 * - Sync API server
 * - MCP server
 * - Local sync DB
 * - Remote client DB
 * - Remote client API
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatusState>({
    syncApi: ConnectionState.CHECKING,
    mcpServer: ConnectionState.CHECKING,
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
      const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error(`Connection check failed for ${endpoint}:`, err);
      }
      return false;
    }
  };

  const checkAllConnections = async () => {
    try {
      const [syncApiConnected, mcpServerConnected, syncDbConnected, remoteDbConnected, remoteApiConnected] =
        await Promise.all([
          checkConnection('/health'),
          checkConnection('/api/health/mcp'),
          checkConnection('/api/health/sync-db'),
          checkConnection('/api/health/remote-db'),
          checkConnection('/api/health/remote-api'),
        ]);

      setStatus({
        syncApi: syncApiConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
        mcpServer: mcpServerConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
        syncDb: syncDbConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
        remoteDb: remoteDbConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
        remoteApi: remoteApiConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
      });
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
    status.syncApi === ConnectionState.CONNECTED &&
    status.mcpServer === ConnectionState.CONNECTED &&
    status.syncDb === ConnectionState.CONNECTED &&
    status.remoteDb === ConnectionState.CONNECTED &&
    status.remoteApi === ConnectionState.CONNECTED;

  const isRemoteSystemConnected =
    status.remoteDb === ConnectionState.CONNECTED &&
    status.remoteApi === ConnectionState.CONNECTED;

  const isLocalSystemConnected =
    status.syncApi === ConnectionState.CONNECTED &&
    status.mcpServer === ConnectionState.CONNECTED &&
    status.syncDb === ConnectionState.CONNECTED;

  return {
    status,
    isAllConnected,
    isRemoteSystemConnected,
    isLocalSystemConnected,
    refresh: checkAllConnections,
  };
}
