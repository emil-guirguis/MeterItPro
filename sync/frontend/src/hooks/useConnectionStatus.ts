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
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
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
      // Check sync API server
      const syncApiConnected = await checkConnection('/health');
      setStatus((prev) => ({
        ...prev,
        syncApi: syncApiConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
      }));

      // Check MCP server status
      const mcpServerConnected = await checkConnection('/api/health/mcp');
      setStatus((prev) => ({
        ...prev,
        mcpServer: mcpServerConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED,
      }));

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

      // Check remote client API
      const remoteApiConnected = await checkConnection('/api/health/remote-api');
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
