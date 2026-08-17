/**
 * Configuration types for the sync system
 */

/**
 * API client configuration
 */
export interface ApiClientConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * BACnet meter reading agent configuration
 */
export interface BACnetMeterReadingAgentConfig {
  syncDatabase: any; // SyncDatabase type
  collectionIntervalSeconds?: number;  // Default: 600 (10 minutes in seconds)
  uploadCronExpression?: string;        // Default: "*/15 * * * *" (every 15 minutes)
  enableAutoStart?: boolean;            // Default: true
  bacnetInterface?: string;             // Default: '0.0.0.0'
  bacnetPort?: number;                  // Default: 47808
  connectionTimeoutMs?: number;         // Default: 5000
  readTimeoutMs?: number;               // Default: 3000
  batchReadTimeoutMs?: number;          // Default: 5000
  sequentialReadTimeoutMs?: number;     // Default: 3000
  connectivityCheckTimeoutMs?: number;  // Default: 2000
  enableConnectivityCheck?: boolean;    // Default: true - Check meter online before reading
  enableSequentialFallback?: boolean;   // Default: true - Fall back to sequential reads on batch failure
  adaptiveBatchSizing?: boolean;        // Default: true - Reduce batch size on timeout
  meterCache?: any;                     // Optional: shared MeterCache instance
  deviceRegisterCache?: any;            // Optional: shared DeviceRegisterCache instance
  apiClient?: any;                      // Optional: ClientSystemApiClient for uploads
}
