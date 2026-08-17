/**
 * Connection status types for database and API connections
 */

export interface ConnectionStatus {
  local: DatabaseConnectionStatus;
  remote: RemoteConnectionStatus;
}

export interface DatabaseConnectionStatus {
  isConnected: boolean | null;
  isChecking: boolean;
  error: string | null;
}

export interface RemoteConnectionStatus {
  database: DatabaseConnectionStatus;
  api: DatabaseConnectionStatus;
}

export enum ConnectionState {
  CHECKING = 'checking',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

export interface ConnectionCheckResult {
  success: boolean;
  message?: string;
  timestamp: Date;
}
