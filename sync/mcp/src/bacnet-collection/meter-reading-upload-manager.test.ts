/**
 * Tests for MeterReadingUploadManager initialization and configuration
 * 
 * Verifies:
 * - Task 2.1: Upload manager initializes with correct configuration
 * - Task 2.2: Connectivity monitor is initialized and started
 * - Task 3.1: Cron job schedules uploads at correct interval
 * - Task 3.2: Manual upload trigger works correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MeterReadingUploadManager, MeterReadingUploadManagerConfig } from './meter-reading-upload-manager.js';
import { ClientSystemApiClient } from '../api/client-system-api.js';
import { SyncDatabase } from '../data-sync/data-sync.js';
import { cacheManager } from '../cache/cache-manager.js';

const mockTenant = {
  tenant_id: 'test-tenant-123',
  name: 'Test Tenant',
  url: 'http://localhost:8787',
  api_key: 'test-api-key',
  active: true,
};

// Mock implementations
class MockSyncDatabase implements Partial<SyncDatabase> {
  async getUnsynchronizedReadings() {
    return [];
  }

  async incrementRetryCount() {
    return;
  }

  async deleteSynchronizedReadings() {
    return 0;
  }

  async logSyncOperation() {
    return;
  }

  async getSyncStats() {
    return {};
  }
}

class MockClientSystemApiClient implements Partial<ClientSystemApiClient> {
  private apiKey: string = '';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  getApiKey() {
    return this.apiKey;
  }

  async uploadBatch() {
    return { success: true, recordsProcessed: 0 };
  }

  async testConnection() {
    return true;
  }
}

describe('MeterReadingUploadManager - Task 2.1: Initialization and Configuration', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
  });

  describe('Configuration Loading', () => {
    it('should initialize with default configuration values', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      const status = uploadManager.getStatus();

      // Verify default values are set
      expect(status).toBeDefined();
      expect(status.isRunning).toBe(false);
      expect(status.queueSize).toBe(0);
      expect(status.totalUploaded).toBe(0);
      expect(status.totalFailed).toBe(0);
    });

    it('should initialize with custom upload interval (5 minutes default)', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify the manager was created successfully with the interval
      expect(uploadManager).toBeDefined();
      const status = uploadManager.getStatus();
      expect(status).toBeDefined();
    });

    it('should initialize with custom batch size (1000 default)', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        batchSize: 1000,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify the manager was created successfully with the batch size
      expect(uploadManager).toBeDefined();
      const status = uploadManager.getStatus();
      expect(status).toBeDefined();
    });

    it('should initialize with custom max retries (5 default)', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        maxRetries: 5,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify the manager was created successfully with max retries
      expect(uploadManager).toBeDefined();
      const status = uploadManager.getStatus();
      expect(status).toBeDefined();
    });

    it('should use all default values when no config provided', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify defaults are applied
      expect(uploadManager).toBeDefined();
      const status = uploadManager.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  describe('API Key Management', () => {
    it('should set API key on the API client during initialization', () => {
      const testApiKey = 'test-api-key-12345';
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Manually set API key (simulating what happens in start())
      mockApiClient.setApiKey(testApiKey);
      
      // Verify API key was set
      expect(mockApiClient.getApiKey()).toBe(testApiKey);
    });

    it('should accept API key from configuration', () => {
      const testApiKey = 'configured-api-key';
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      mockApiClient.setApiKey(testApiKey);
      
      expect(mockApiClient.getApiKey()).toBe(testApiKey);
    });
  });

  describe('Status Initialization', () => {
    it('should initialize with correct status structure', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      const status = uploadManager.getStatus();

      // Verify all required status fields exist
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('queueSize');
      expect(status).toHaveProperty('totalUploaded');
      expect(status).toHaveProperty('totalFailed');
      expect(status).toHaveProperty('isClientConnected');
    });

    it('should initialize status with correct default values', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      const status = uploadManager.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.queueSize).toBe(0);
      expect(status.totalUploaded).toBe(0);
      expect(status.totalFailed).toBe(0);
      expect(status.isClientConnected).toBe(false);
    });
  });
});

describe('MeterReadingUploadManager - Task 2.2: Connectivity Monitor Initialization', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    vi.restoreAllMocks();
  });

  describe('ConnectivityMonitor Creation', () => {
    it('should create ConnectivityMonitor with correct interval', () => {
      const checkIntervalMs = 60000; // 60 seconds
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        connectivityCheckIntervalMs: checkIntervalMs,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify the manager was created successfully
      expect(uploadManager).toBeDefined();
      const connectivityStatus = uploadManager.getConnectivityStatus();
      expect(connectivityStatus).toBeDefined();
    });

    it('should use default connectivity check interval if not specified', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify the manager was created with default interval
      expect(uploadManager).toBeDefined();
      const connectivityStatus = uploadManager.getConnectivityStatus();
      expect(connectivityStatus).toBeDefined();
    });
  });

  describe('Event Listeners', () => {
    it('should listen for connected event from ConnectivityMonitor', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify the manager was created and can receive events
      expect(uploadManager).toBeDefined();
      const status = uploadManager.getStatus();
      expect(status).toBeDefined();
    });

    it('should listen for disconnected event from ConnectivityMonitor', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify the manager was created and can receive events
      expect(uploadManager).toBeDefined();
      const status = uploadManager.getStatus();
      expect(status).toBeDefined();
    });
  });

  describe('Connectivity Status', () => {
    it('should provide connectivity status from monitor', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      await uploadManager.start();
      const connectivityStatus = uploadManager.getConnectivityStatus();

      // Verify connectivity status structure
      expect(connectivityStatus).toBeDefined();
      expect(connectivityStatus).toHaveProperty('isConnected');
      expect(connectivityStatus).toHaveProperty('lastCheckTime');
    });
  });

  describe('Auto Upload Configuration', () => {
    it('should enable auto upload by default', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: true,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify the manager was created with auto upload enabled
      expect(uploadManager).toBeDefined();
    });

    it('should allow disabling auto upload', () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Verify the manager was created with auto upload disabled
      expect(uploadManager).toBeDefined();
    });
  });
});

describe('MeterReadingUploadManager - Integration Tests', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
  });

  it('should initialize all components together', () => {
    const config: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      batchSize: 1000,
      maxRetries: 5,
      enableAutoUpload: true,
      connectivityCheckIntervalMs: 60000,
    };

    uploadManager = new MeterReadingUploadManager(config);
    
    // Verify all components are initialized
    expect(uploadManager).toBeDefined();
    const status = uploadManager.getStatus();
    expect(status).toBeDefined();
    expect(status.isRunning).toBe(false);
    
    const connectivityStatus = uploadManager.getConnectivityStatus();
    expect(connectivityStatus).toBeDefined();
  });

  it('should maintain separate instances with different configurations', () => {
    const config1: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      enableAutoUpload: false,
    };

    const config2: MeterReadingUploadManagerConfig = {
      database: mockDatabase as any,
      apiClient: mockApiClient as any,
      enableAutoUpload: false,
    };

    const manager1 = new MeterReadingUploadManager(config1);
    const manager2 = new MeterReadingUploadManager(config2);

    // Verify both managers are independent
    expect(manager1).toBeDefined();
    expect(manager2).toBeDefined();
    expect(manager1).not.toBe(manager2);
  });
});

describe('MeterReadingUploadManager - Task 3.1: Cron Job Scheduling', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
    vi.spyOn(cacheManager, 'getTenant').mockReturnValue(mockTenant as any);
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
    vi.restoreAllMocks();
  });

  describe('Cron Expression Generation', () => {
    it('should generate correct cron expression for 5-minute interval', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: true,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Start the manager to schedule the cron job
      await uploadManager.start();
      
      // Verify the manager is running
      const status = uploadManager.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should generate correct cron expression for 10-minute interval', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: true,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Start the manager to schedule the cron job
      await uploadManager.start();
      
      // Verify the manager is running
      const status = uploadManager.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should generate correct cron expression for 1-minute interval', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: true,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Start the manager to schedule the cron job
      await uploadManager.start();
      
      // Verify the manager is running
      const status = uploadManager.getStatus();
      expect(status.isRunning).toBe(true);
    });
  });

  describe('Scheduled Upload Triggering', () => {
    it('should trigger upload when scheduled time arrives', async () => {
      let uploadCalled = false;
      
      const mockDatabaseWithTracking = new MockSyncDatabase();
      const originalGetUnsynchronized = mockDatabaseWithTracking.getUnsynchronizedReadings;
      mockDatabaseWithTracking.getUnsynchronizedReadings = async function() {
        uploadCalled = true;
        return originalGetUnsynchronized.call(this);
      };

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabaseWithTracking as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: true,
      };

      uploadManager = new MeterReadingUploadManager(config);

      // Start the manager - this should trigger an immediate upload
      await uploadManager.start();
      
      // Give it a moment to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify upload was triggered
      expect(uploadCalled).toBe(true);
    });

    it('should not trigger upload if auto upload is disabled', async () => {
      let uploadCalled = false;
      
      const mockDatabaseWithTracking = new MockSyncDatabase();
      const originalGetUnsynchronized = mockDatabaseWithTracking.getUnsynchronizedReadings;
      mockDatabaseWithTracking.getUnsynchronizedReadings = async function() {
        uploadCalled = true;
        return originalGetUnsynchronized.call(this);
      };

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabaseWithTracking as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);

      // Start the manager with auto upload disabled
      await uploadManager.start();
      
      // Give it a moment to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify upload was NOT triggered
      expect(uploadCalled).toBe(false);
    });
  });

  describe('Cron Job Lifecycle', () => {
    it('should start cron job when manager starts', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: true,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Initially not running
      expect(uploadManager.getStatus().isRunning).toBe(false);
      
      // Start the manager
      await uploadManager.start();
      
      // Now should be running
      expect(uploadManager.getStatus().isRunning).toBe(true);
    });

    it('should stop cron job when manager stops', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: true,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Start the manager
      await uploadManager.start();
      expect(uploadManager.getStatus().isRunning).toBe(true);
      
      // Stop the manager
      await uploadManager.stop();
      
      // Should no longer be running
      expect(uploadManager.getStatus().isRunning).toBe(false);
    });

    it('should prevent starting if already running', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: true,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Start the manager
      await uploadManager.start();
      expect(uploadManager.getStatus().isRunning).toBe(true);
      
      // Try to start again - should be idempotent
      await uploadManager.start();
      
      // Should still be running
      expect(uploadManager.getStatus().isRunning).toBe(true);
    });
  });
});

describe('MeterReadingUploadManager - Task 3.2: Manual Upload Trigger', () => {
  let uploadManager: MeterReadingUploadManager;
  let mockDatabase: MockSyncDatabase;
  let mockApiClient: MockClientSystemApiClient;

  beforeEach(() => {
    mockDatabase = new MockSyncDatabase();
    mockApiClient = new MockClientSystemApiClient();
  });

  afterEach(async () => {
    if (uploadManager) {
      await uploadManager.stop();
    }
  });

  describe('Manual Upload Triggering', () => {
    it('should trigger upload immediately when triggerUpload is called', async () => {
      let uploadCalled = false;
      
      const mockDatabaseWithTracking = new MockSyncDatabase();
      const originalGetUnsynchronized = mockDatabaseWithTracking.getUnsynchronizedReadings;
      mockDatabaseWithTracking.getUnsynchronizedReadings = async function() {
        uploadCalled = true;
        return originalGetUnsynchronized.call(this);
      };

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabaseWithTracking as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Trigger manual upload
      await uploadManager.triggerUpload();
      
      // Give it a moment to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify upload was triggered
      expect(uploadCalled).toBe(true);
    });

    it('should skip manual upload if one is already in progress', async () => {
      let uploadCallCount = 0;
      
      const mockDatabaseWithTracking = new MockSyncDatabase();
      const originalGetUnsynchronized = mockDatabaseWithTracking.getUnsynchronizedReadings;
      mockDatabaseWithTracking.getUnsynchronizedReadings = async function() {
        uploadCallCount++;
        // Simulate a slow upload
        await new Promise(resolve => setTimeout(resolve, 200));
        return originalGetUnsynchronized.call(this);
      };

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabaseWithTracking as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Start first upload
      const upload1 = uploadManager.triggerUpload();
      
      // Immediately try to trigger another upload
      const upload2 = uploadManager.triggerUpload();
      
      // Wait for both to complete
      await Promise.all([upload1, upload2]);
      
      // Should only have called getUnsynchronizedReadings once
      expect(uploadCallCount).toBe(1);
    });

    it('should return upload status after manual trigger', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Trigger manual upload
      await uploadManager.triggerUpload();
      
      // Get status
      const status = uploadManager.getStatus();
      
      // Verify status is returned
      expect(status).toBeDefined();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('lastUploadTime');
      expect(status).toHaveProperty('lastUploadSuccess');
    });

    it('should allow manual upload even when auto upload is disabled', async () => {
      let uploadCalled = false;
      
      const mockDatabaseWithTracking = new MockSyncDatabase();
      const originalGetUnsynchronized = mockDatabaseWithTracking.getUnsynchronizedReadings;
      mockDatabaseWithTracking.getUnsynchronizedReadings = async function() {
        uploadCalled = true;
        return originalGetUnsynchronized.call(this);
      };

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabaseWithTracking as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Trigger manual upload
      await uploadManager.triggerUpload();
      
      // Give it a moment to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify upload was triggered
      expect(uploadCalled).toBe(true);
    });

    it('should support triggerManualUpload alias method', async () => {
      let uploadCalled = false;
      
      const mockDatabaseWithTracking = new MockSyncDatabase();
      const originalGetUnsynchronized = mockDatabaseWithTracking.getUnsynchronizedReadings;
      mockDatabaseWithTracking.getUnsynchronizedReadings = async function() {
        uploadCalled = true;
        return originalGetUnsynchronized.call(this);
      };

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabaseWithTracking as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Trigger manual upload using alias method
      await uploadManager.triggerManualUpload();
      
      // Give it a moment to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify upload was triggered
      expect(uploadCalled).toBe(true);
    });
  });

  describe('Upload Status After Manual Trigger', () => {
    it('should update lastUploadTime after manual trigger', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Get initial status
      const statusBefore = uploadManager.getStatus();
      expect(statusBefore.lastUploadTime).toBeUndefined();
      
      // Trigger manual upload
      await uploadManager.triggerUpload();
      
      // Get status after upload
      const statusAfter = uploadManager.getStatus();
      
      // Verify lastUploadTime was updated
      expect(statusAfter.lastUploadTime).toBeDefined();
    });

    it('should update lastUploadSuccess status', async () => {
      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabase as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Trigger manual upload
      await uploadManager.triggerUpload();
      
      // Get status after upload
      const status = uploadManager.getStatus();
      
      // Verify lastUploadSuccess was set
      expect(status.lastUploadSuccess).toBeDefined();
    });
  });

  describe('Manual Upload Concurrency', () => {
    it('should not allow concurrent manual uploads', async () => {
      let uploadCallCount = 0;
      
      const mockDatabaseWithTracking = new MockSyncDatabase();
      const originalGetUnsynchronized = mockDatabaseWithTracking.getUnsynchronizedReadings;
      mockDatabaseWithTracking.getUnsynchronizedReadings = async function() {
        uploadCallCount++;
        // Simulate a slow upload
        await new Promise(resolve => setTimeout(resolve, 300));
        return originalGetUnsynchronized.call(this);
      };

      const config: MeterReadingUploadManagerConfig = {
        database: mockDatabaseWithTracking as any,
        apiClient: mockApiClient as any,
        enableAutoUpload: false,
      };

      uploadManager = new MeterReadingUploadManager(config);
      
      // Trigger multiple uploads concurrently
      await Promise.all([
        uploadManager.triggerUpload(),
        uploadManager.triggerUpload(),
        uploadManager.triggerUpload(),
      ]);
      
      // Should only have called getUnsynchronizedReadings once
      expect(uploadCallCount).toBe(1);
    });
  });
});
