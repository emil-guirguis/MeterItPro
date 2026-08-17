import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { BACnetClient, BACnetClientConfig, BatchReadRequest } from './bacnet-client';

describe('BACnetClient Configuration', () => {
  describe('Constructor with default values', () => {
    it('should use default timeout values when not specified', () => {
      const client = new BACnetClient({});

      // Access private fields through any type for testing
      const clientAny = client as any;
      expect(clientAny.batchReadTimeout).toBe(5000);
      expect(clientAny.sequentialReadTimeout).toBe(3000);
      expect(clientAny.connectivityCheckTimeout).toBe(2000);
    });

    it('should use default interface and port when not specified', () => {
      const client = new BACnetClient({});

      const clientAny = client as any;
      expect(clientAny.bacnetInterface).toBe('0.0.0.0');
      expect(clientAny.bacnetPort).toBe(47808);
    });

    it('should use default apduTimeout when not specified', () => {
      const client = new BACnetClient({});

      const clientAny = client as any;
      expect(clientAny.apduTimeout).toBe(6000);
    });
  });

  describe('Constructor with custom values', () => {
    it('should accept custom batchReadTimeout', () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 8000,
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.batchReadTimeout).toBe(8000);
    });

    it('should accept custom sequentialReadTimeout', () => {
      const config: BACnetClientConfig = {
        sequentialReadTimeout: 4000,
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.sequentialReadTimeout).toBe(4000);
    });

    it('should accept custom connectivityCheckTimeout', () => {
      const config: BACnetClientConfig = {
        connectivityCheckTimeout: 1500,
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.connectivityCheckTimeout).toBe(1500);
    });

    it('should accept all custom timeout values', () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 7000,
        sequentialReadTimeout: 4500,
        connectivityCheckTimeout: 1800,
        apduTimeout: 7500,
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.batchReadTimeout).toBe(7000);
      expect(clientAny.sequentialReadTimeout).toBe(4500);
      expect(clientAny.connectivityCheckTimeout).toBe(1800);
      expect(clientAny.apduTimeout).toBe(7500);
    });

    it('should accept custom interface and port', () => {
      const config: BACnetClientConfig = {
        bacnetInterface: '192.168.1.100',
        bacnetPort: 47809,
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.bacnetInterface).toBe('192.168.1.100');
      expect(clientAny.bacnetPort).toBe(47809);
    });
  });

  describe('Timeout value constraints', () => {
    it('should accept minimum timeout value of 1000ms', () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 1000,
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.batchReadTimeout).toBe(1000);
    });

    it('should accept large timeout values', () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 30000,
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.batchReadTimeout).toBe(30000);
    });

    it('should maintain timeout values as specified', () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 5000,
        sequentialReadTimeout: 3000,
        connectivityCheckTimeout: 2000,
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.batchReadTimeout).toBe(5000);
      expect(clientAny.sequentialReadTimeout).toBe(3000);
      expect(clientAny.connectivityCheckTimeout).toBe(2000);
    });
  });

  describe('Partial configuration', () => {
    it('should use defaults for unspecified timeout values', () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 6000,
        // sequentialReadTimeout not specified
        // connectivityCheckTimeout not specified
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.batchReadTimeout).toBe(6000);
      expect(clientAny.sequentialReadTimeout).toBe(3000); // default
      expect(clientAny.connectivityCheckTimeout).toBe(2000); // default
    });

    it('should use defaults for unspecified network values', () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 5000,
        // bacnetInterface not specified
        // bacnetPort not specified
      };
      const client = new BACnetClient(config);

      const clientAny = client as any;
      expect(clientAny.bacnetInterface).toBe('0.0.0.0'); // default
      expect(clientAny.bacnetPort).toBe(47808); // default
    });
  });

  describe('Configuration persistence', () => {
    it('should maintain configuration across multiple instances', () => {
      const config1: BACnetClientConfig = {
        batchReadTimeout: 5000,
      };
      const config2: BACnetClientConfig = {
        batchReadTimeout: 8000,
      };

      const client1 = new BACnetClient(config1);
      const client2 = new BACnetClient(config2);

      const client1Any = client1 as any;
      const client2Any = client2 as any;

      expect(client1Any.batchReadTimeout).toBe(5000);
      expect(client2Any.batchReadTimeout).toBe(8000);
    });
  });
});

describe('BACnetClient Batch Read Timeout Handling', () => {
  let client: BACnetClient;

  beforeEach(() => {
    client = new BACnetClient({
      batchReadTimeout: 1000,
    });
  });

  describe('readPropertyMultiple with timeout handling', () => {
    it('should return all results as failed when batch read times out', async () => {
      const clientAny = client as any;
      
      // Mock to never call callback (simulating timeout)
      clientAny.client.readPropertyMultiple = vi.fn((_address: string, _requests: any, _options: any, _callback: Function) => {
        // Never call callback - simulates timeout
      });

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
        { objectType: 'analogInput', objectInstance: 1, propertyId: 'presentValue', fieldName: 'power_b' },
      ];

      const results = await client.readPropertyMultiple('192.168.1.100', 47808, requests, 500);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('timeout');
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('timeout');
    }, 3000);

    it('should return successful results when batch read completes before timeout', async () => {
      const clientAny = client as any;
      
      clientAny.client.readPropertyMultiple = vi.fn((_address: string, _requests: any, _options: any, callback: Function) => {
        setTimeout(() => {
          callback(null, {
            values: [
              { values: [{ value: 100 }] },
              { values: [{ value: 200 }] },
            ],
          });
        }, 100);
      });

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
        { objectType: 'analogInput', objectInstance: 1, propertyId: 'presentValue', fieldName: 'power_b' },
      ];

      const results = await client.readPropertyMultiple('192.168.1.100', 47808, requests, 1000);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(100);
      expect(results[1].success).toBe(true);
      expect(results[1].value).toBe(200);
    });

    it('should mark timed-out registers with error message', async () => {
      const clientAny = client as any;
      
      // Mock to never call callback (simulating timeout)
      clientAny.client.readPropertyMultiple = vi.fn((_address: string, _requests: any, _options: any, _callback: Function) => {
        // Never call callback
      });

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      const results = await client.readPropertyMultiple('192.168.1.100', 47808, requests, 300);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toMatch(/timeout after \d+ms/i);
    }, 2000);

    it('should handle batch read errors gracefully', async () => {
      const clientAny = client as any;
      
      clientAny.client.readPropertyMultiple = vi.fn((_address: string, _requests: any, _options: any, callback: Function) => {
        setTimeout(() => {
          callback(new Error('Device communication failed'), null);
        }, 100);
      });

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      const results = await client.readPropertyMultiple('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Device communication failed');
    });

    it('should handle invalid response structure', async () => {
      const clientAny = client as any;
      
      clientAny.client.readPropertyMultiple = vi.fn((_address: string, _requests: any, _options: any, callback: Function) => {
        setTimeout(() => {
          callback(null, { invalid: 'structure' });
        }, 100);
      });

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      const results = await client.readPropertyMultiple('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Invalid response structure');
    });

    it('should handle empty response values', async () => {
      const clientAny = client as any;
      
      clientAny.client.readPropertyMultiple = vi.fn((_address: string, _requests: any, _options: any, callback: Function) => {
        setTimeout(() => {
          callback(null, {
            values: [
              { values: [] }, // Empty values array
            ],
          });
        }, 100);
      });

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      const results = await client.readPropertyMultiple('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Empty response');
    });

    it('should preserve request metadata in results', async () => {
      const clientAny = client as any;
      
      clientAny.client.readPropertyMultiple = vi.fn((_address: string, _requests: any, _options: any, callback: Function) => {
        setTimeout(() => {
          callback(null, {
            values: [
              { values: [{ value: 100 }] },
            ],
          });
        }, 100);
      });

      const requests = [
        { objectType: 'analogInput', objectInstance: 5, propertyId: 'presentValue', fieldName: 'custom_field' },
      ];

      const results = await client.readPropertyMultiple('192.168.1.100', 47808, requests);

      expect(results[0].objectType).toBe('analogInput');
      expect(results[0].objectInstance).toBe(5);
      expect(results[0].propertyId).toBe('presentValue');
      expect(results[0].fieldName).toBe('custom_field');
    });

    it('should use configured batch read timeout when not specified', async () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 800,
      };
      const testClient = new BACnetClient(config);
      const clientAny = testClient as any;
      
      const startTime = Date.now();
      
      clientAny.client.readPropertyMultiple = vi.fn((_address: string, _requests: any, _options: any, _callback: Function) => {
        // Never call callback
      });

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      await testClient.readPropertyMultiple('192.168.1.100', 47808, requests);
      const elapsedTime = Date.now() - startTime;
      
      // Should timeout around 800ms (allow some variance)
      expect(elapsedTime).toBeGreaterThanOrEqual(700);
      expect(elapsedTime).toBeLessThan(1200);
    }, 3000);

    it('should use provided timeout parameter over configured timeout', async () => {
      const config: BACnetClientConfig = {
        batchReadTimeout: 2000,
      };
      const testClient = new BACnetClient(config);
      const clientAny = testClient as any;
      
      const startTime = Date.now();
      
      clientAny.client.readPropertyMultiple = vi.fn((_address: string, _requests: any, _options: any, _callback: Function) => {
        // Never call callback
      });

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      await testClient.readPropertyMultiple('192.168.1.100', 47808, requests, 400);
      const elapsedTime = Date.now() - startTime;
      
      // Should timeout around 400ms (not 2000ms)
      expect(elapsedTime).toBeGreaterThanOrEqual(300);
      expect(elapsedTime).toBeLessThan(800);
    }, 3000);
  });
});

describe('BACnetClient Connectivity Check', () => {
  let client: BACnetClient;

  beforeEach(() => {
    client = new BACnetClient({
      connectivityCheckTimeout: 2000,
    });
  });

  describe('checkConnectivity method', () => {
    it('should return true when device responds successfully', async () => {
      const clientAny = client as any;
      
      // Mock the client.readProperty to simulate successful response
      clientAny.client.readProperty = vi.fn((_address: string, _objectId: any, _propertyId: number, callback: Function) => {
        // Simulate successful read
        setTimeout(() => callback(null, 42), 100);
      });

      const result = await client.checkConnectivity('192.168.1.100', 47808);
      expect(result).toBe(true);
    });

    it('should return true when device returns a BACnet error reply (device is online)', async () => {
      const clientAny = client as any;

      // Mock the client.readProperty to simulate BACnet error response
      // Any BACnet reply (even an error) means the device is reachable
      clientAny.client.readProperty = vi.fn((_address: string, _objectId: any, _propertyId: number, callback: Function) => {
        setTimeout(() => callback(new Error('BACnet error'), null), 100);
      });

      const result = await client.checkConnectivity('192.168.1.100', 47808);
      expect(result).toBe(true);
    });

    it('should return false when connectivity check times out', async () => {
      const clientAny = client as any;
      
      // Mock the client.readProperty to never call callback (simulating timeout)
      clientAny.client.readProperty = vi.fn((_address: string, _objectId: any, _propertyId: number, _callback: Function) => {
        // Never call callback - simulates timeout
      });

      const result = await client.checkConnectivity('192.168.1.100', 47808);
      expect(result).toBe(false);
    }, 5000);

    it('should return true when device returns null value (device replied)', async () => {
      const clientAny = client as any;

      // Any callback from the device means it is reachable, even if value is null
      clientAny.client.readProperty = vi.fn((_address: string, _objectId: any, _propertyId: number, callback: Function) => {
        setTimeout(() => callback(null, null), 100);
      });

      const result = await client.checkConnectivity('192.168.1.100', 47808);
      expect(result).toBe(true);
    });

    it('should return false when readProperty throws exception', async () => {
      const clientAny = client as any;
      
      // Mock the client.readProperty to throw exception
      clientAny.client.readProperty = vi.fn(() => {
        throw new Error('Connection failed');
      });

      const result = await client.checkConnectivity('192.168.1.100', 47808);
      expect(result).toBe(false);
    });

    it('should use connectivityCheckTimeout for the operation', async () => {
      const config: BACnetClientConfig = {
        connectivityCheckTimeout: 1500,
      };
      const testClient = new BACnetClient(config);
      const clientAny = testClient as any;
      
      const startTime = Date.now();
      
      // Mock to never respond (will timeout)
      clientAny.client.readProperty = vi.fn(() => {
        // Never call callback
      });

      await testClient.checkConnectivity('192.168.1.100', 47808);
      const elapsedTime = Date.now() - startTime;
      
      // Should timeout around 1500ms (allow some variance)
      expect(elapsedTime).toBeGreaterThanOrEqual(1400);
      expect(elapsedTime).toBeLessThan(2000);
    }, 5000);

    it('should read objectName property from device object', async () => {
      const clientAny = client as any;

      const mockReadProperty = vi.fn((_address: string, objectId: any, propertyId: number, callback: Function) => {
        // Verify correct object and property are being read
        expect(objectId.type).toBe(8); // Device object type
        expect(objectId.instance).toBe(0); // Device instance
        expect(propertyId).toBe(77); // objectName property (prop 77)

        setTimeout(() => callback(null, 'DeviceName'), 100);
      });
      
      clientAny.client.readProperty = mockReadProperty;

      await client.checkConnectivity('192.168.1.100', 47808);
      expect(mockReadProperty).toHaveBeenCalled();
    });

    it('should handle multiple connectivity checks sequentially', async () => {
      const clientAny = client as any;
      
      clientAny.client.readProperty = vi.fn((_address: string, _objectId: any, _propertyId: number, callback: Function) => {
        setTimeout(() => callback(null, 42), 100);
      });

      const result1 = await client.checkConnectivity('192.168.1.100', 47808);
      const result2 = await client.checkConnectivity('192.168.1.101', 47808);
      const result3 = await client.checkConnectivity('192.168.1.102', 47808);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
  });
});

describe('BACnetClient Sequential Fallback Reads', () => {
  let client: BACnetClient;

  beforeEach(() => {
    client = new BACnetClient({
      sequentialReadTimeout: 1000,
    });
  });

  describe('readPropertySequential method', () => {
    it('should read each register individually', async () => {
      const clientAny = client as any;
      
      const mockReadProperty = vi.fn(async (_ip: string, _port: number, _objectType: string, _objectInstance: number, _propertyId: string, _timeoutMs?: number) => {
        return { success: true, value: 100 };
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
        { objectType: 'analogInput', objectInstance: 1, propertyId: 'presentValue', fieldName: 'power_b' },
      ];

      const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(2);
      expect(mockReadProperty).toHaveBeenCalledTimes(2);
    });

    it('should return partial results for any that succeed', async () => {
      const clientAny = client as any;
      
      let callCount = 0;
      const mockReadProperty = vi.fn(async (_ip: string, _port: number, _objectType: string, _objectInstance: number, _propertyId: string, _timeoutMs?: number) => {
        callCount++;
        if (callCount === 1) {
          return { success: true, value: 100 };
        } else {
          return { success: false, error: 'Device timeout' };
        }
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
        { objectType: 'analogInput', objectInstance: 1, propertyId: 'presentValue', fieldName: 'power_b' },
      ];

      const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(100);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Device timeout');
    });

    it('should use configured sequential read timeout', async () => {
      const config: BACnetClientConfig = {
        sequentialReadTimeout: 2000,
      };
      const testClient = new BACnetClient(config);
      const clientAny = testClient as any;
      
      const mockReadProperty = vi.fn(async (_ip: string, _port: number, _objectType: string, _objectInstance: number, _propertyId: string, timeoutMs?: number) => {
        // Verify timeout is passed correctly
        expect(timeoutMs).toBe(2000);
        return { success: true, value: 100 };
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      await testClient.readPropertySequential('192.168.1.100', 47808, requests);
      expect(mockReadProperty).toHaveBeenCalled();
    });

    it('should use provided timeout parameter over configured timeout', async () => {
      const config: BACnetClientConfig = {
        sequentialReadTimeout: 3000,
      };
      const testClient = new BACnetClient(config);
      const clientAny = testClient as any;
      
      const mockReadProperty = vi.fn(async (_ip: string, _port: number, _objectType: string, _objectInstance: number, _propertyId: string, timeoutMs?: number) => {
        // Verify provided timeout is used
        expect(timeoutMs).toBe(1500);
        return { success: true, value: 100 };
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      await testClient.readPropertySequential('192.168.1.100', 47808, requests, 1500);
      expect(mockReadProperty).toHaveBeenCalled();
    });

    it('should preserve request metadata in results', async () => {
      const clientAny = client as any;
      
      const mockReadProperty = vi.fn(async (_ip: string, _port: number, _objectType: string, _objectInstance: number, _propertyId: string, _timeoutMs?: number) => {
        return { success: true, value: 100 };
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 5, propertyId: 'presentValue', fieldName: 'custom_field' },
      ];

      const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

      expect(results[0].objectType).toBe('analogInput');
      expect(results[0].objectInstance).toBe(5);
      expect(results[0].propertyId).toBe('presentValue');
      expect(results[0].fieldName).toBe('custom_field');
    });

    it('should handle all registers failing', async () => {
      const clientAny = client as any;
      
      const mockReadProperty = vi.fn(async (_ip: string, _port: number, _objectType: string, _objectInstance: number, _propertyId: string, _timeoutMs?: number) => {
        return { success: false, error: 'Device unreachable' };
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
        { objectType: 'analogInput', objectInstance: 1, propertyId: 'presentValue', fieldName: 'power_b' },
      ];

      const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Device unreachable');
      });
    });

    it('should handle all registers succeeding', async () => {
      const clientAny = client as any;
      
      let callCount = 0;
      const mockReadProperty = vi.fn(async (_ip: string, _port: number, _objectType: string, _objectInstance: number, _propertyId: string, _timeoutMs?: number) => {
        callCount++;
        return { success: true, value: 100 + callCount };
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
        { objectType: 'analogInput', objectInstance: 1, propertyId: 'presentValue', fieldName: 'power_b' },
        { objectType: 'analogInput', objectInstance: 2, propertyId: 'presentValue', fieldName: 'power_c' },
      ];

      const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.value).toBeGreaterThan(100);
      });
    });

    it('should handle empty request list', async () => {
      const clientAny = client as any;
      
      const mockReadProperty = vi.fn(async () => {
        return { success: true, value: 100 };
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests: BatchReadRequest[] = [];

      const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(0);
      expect(mockReadProperty).not.toHaveBeenCalled();
    });

    it('should handle single register', async () => {
      const clientAny = client as any;
      
      const mockReadProperty = vi.fn(async (_ip: string, _port: number, _objectType: string, _objectInstance: number, _propertyId: string, _timeoutMs?: number) => {
        return { success: true, value: 100 };
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(100);
    });

    it('should handle exceptions during individual reads', async () => {
      const clientAny = client as any;
      
      const mockReadProperty = vi.fn(async () => {
        throw new Error('Connection failed');
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
      ];

      const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Connection failed');
    });

    it('should continue reading after individual register failure', async () => {
      const clientAny = client as any;
      
      let callCount = 0;
      const mockReadProperty = vi.fn(async () => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Connection failed');
        }
        return { success: true, value: 100 + callCount };
      });
      
      clientAny.readProperty = mockReadProperty;

      const requests = [
        { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'power_a' },
        { objectType: 'analogInput', objectInstance: 1, propertyId: 'presentValue', fieldName: 'power_b' },
        { objectType: 'analogInput', objectInstance: 2, propertyId: 'presentValue', fieldName: 'power_c' },
      ];

      const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      expect(mockReadProperty).toHaveBeenCalledTimes(3);
    });
  });
});

describe('BACnetClient Property-Based Tests', () => {
  describe('Property 2: Partial Results on Batch Timeout', () => {
    it('should return results for all registers with appropriate success/error status', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 2: Partial Results on Batch Timeout
      // Validates: Requirements 2.1, 2.2, 2.3

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }).chain((numRegisters) =>
            fc.tuple(
              fc.constant(numRegisters),
              fc.array(
                fc.record({
                  objectInstance: fc.integer({ min: 0, max: 100 }),
                  fieldName: fc.string({ minLength: 1, maxLength: 20 }),
                }),
                { minLength: numRegisters, maxLength: numRegisters }
              )
            )
          ),
          async ([numRegisters, registerConfigs]) => {
            const client = new BACnetClient({ batchReadTimeout: 500 });
            const clientAny = client as any;

            // Create batch requests
            const requests: BatchReadRequest[] = registerConfigs.map((config) => ({
              objectType: 'analogInput',
              objectInstance: config.objectInstance,
              propertyId: 'presentValue',
              fieldName: config.fieldName,
            }));

            // Mock to simulate timeout (never call callback)
            clientAny.client.readPropertyMultiple = vi.fn(
              (_address: string, _requests: any, _options: any, _callback: Function) => {
                // Never call callback - simulates timeout
              }
            );

            const results = await client.readPropertyMultiple('192.168.1.100', 47808, requests, 300);

            // Property: For any batch read that times out, the system should return results
            // for all registers with appropriate status
            expect(results).toHaveLength(numRegisters);

            // All results should have the required fields
            results.forEach((result, index) => {
              expect(result).toHaveProperty('success');
              expect(result).toHaveProperty('objectType');
              expect(result).toHaveProperty('objectInstance');
              expect(result).toHaveProperty('propertyId');
              expect(result).toHaveProperty('fieldName');
              expect(result).toHaveProperty('error');

              // On timeout, all should be marked as failed
              expect(result.success).toBe(false);
              expect(result.error).toContain('timeout');

              // Metadata should be preserved
              expect(result.objectType).toBe('analogInput');
              expect(result.objectInstance).toBe(registerConfigs[index].objectInstance);
              expect(result.fieldName).toBe(registerConfigs[index].fieldName);
            });
          }
        ),
        { numRuns: 20 }
      );
    }, 15000);

    it('should mark timed-out registers with error message containing timeout info', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 2: Partial Results on Batch Timeout
      // Validates: Requirements 2.1, 2.2, 2.3
      
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100, max: 2000 }),
          async (timeoutMs) => {
            const client = new BACnetClient({ batchReadTimeout: timeoutMs });
            const clientAny = client as any;

            const requests: BatchReadRequest[] = [
              { objectType: 'analogInput', objectInstance: 0, propertyId: 'presentValue', fieldName: 'test' },
            ];

            // Mock to simulate timeout
            clientAny.client.readPropertyMultiple = vi.fn(
              (_address: string, _requests: any, _options: any, _callback: Function) => {
                // Never call callback
              }
            );

            const results = await client.readPropertyMultiple(
              '192.168.1.100',
              47808,
              requests,
              Math.min(timeoutMs, 300)
            );

            // Property: Timed-out registers should be marked with error message
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toMatch(/timeout/i);
          }
        ),
        { numRuns: 20 }
      );
    }, 15000);

    it('should return all results even when batch read times out', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 2: Partial Results on Batch Timeout
      // Validates: Requirements 2.1, 2.2, 2.3
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              objectInstance: fc.integer({ min: 0, max: 100 }),
              fieldName: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 15 }
          ),
          async (registerConfigs) => {
            const client = new BACnetClient({ batchReadTimeout: 300 });
            const clientAny = client as any;

            const requests: BatchReadRequest[] = registerConfigs.map((config) => ({
              objectType: 'analogInput',
              objectInstance: config.objectInstance,
              propertyId: 'presentValue',
              fieldName: config.fieldName,
            }));

            // Mock to simulate timeout
            clientAny.client.readPropertyMultiple = vi.fn(
              (_address: string, _requests: any, _options: any, _callback: Function) => {
                // Never call callback
              }
            );

            const results = await client.readPropertyMultiple('192.168.1.100', 47808, requests, 200);

            // Property: Result count should match request count
            expect(results.length).toBe(requests.length);

            // All results should have error status on timeout
            results.forEach((result) => {
              expect(result.success).toBe(false);
              expect(result.error).toBeDefined();
            });
          }
        ),
        { numRuns: 20 }
      );
    }, 15000);
  });

  describe('Property 6: Sequential Fallback on Batch Failure', () => {
    it('should return partial results from sequential reads', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 6: Sequential Fallback on Batch Failure
      // Validates: Requirements 5.1, 5.2, 5.3
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              objectInstance: fc.integer({ min: 0, max: 100 }),
              fieldName: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (registerConfigs) => {
            const client = new BACnetClient({ sequentialReadTimeout: 1000 });
            const clientAny = client as any;

            const requests: BatchReadRequest[] = registerConfigs.map((config) => ({
              objectType: 'analogInput',
              objectInstance: config.objectInstance,
              propertyId: 'presentValue',
              fieldName: config.fieldName,
            }));

            // Mock readProperty to return success for all
            clientAny.readProperty = vi.fn(async () => {
              return { success: true, value: 100 };
            });

            const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

            // Property: Result count should match request count
            expect(results.length).toBe(requests.length);

            // All results should have the required fields
            results.forEach((result, index) => {
              expect(result).toHaveProperty('success');
              expect(result).toHaveProperty('objectType');
              expect(result).toHaveProperty('objectInstance');
              expect(result).toHaveProperty('propertyId');
              expect(result).toHaveProperty('fieldName');

              // Metadata should be preserved
              expect(result.objectType).toBe('analogInput');
              expect(result.objectInstance).toBe(registerConfigs[index].objectInstance);
              expect(result.fieldName).toBe(registerConfigs[index].fieldName);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed success and failure in sequential reads', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 6: Sequential Fallback on Batch Failure
      // Validates: Requirements 5.1, 5.2, 5.3
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              objectInstance: fc.integer({ min: 0, max: 100 }),
              fieldName: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (registerConfigs) => {
            const client = new BACnetClient({ sequentialReadTimeout: 1000 });
            const clientAny = client as any;

            const requests: BatchReadRequest[] = registerConfigs.map((config) => ({
              objectType: 'analogInput',
              objectInstance: config.objectInstance,
              propertyId: 'presentValue',
              fieldName: config.fieldName,
            }));

            // Mock readProperty to alternate between success and failure
            let callCount = 0;
            clientAny.readProperty = vi.fn(async () => {
              callCount++;
              if (callCount % 2 === 0) {
                return { success: false, error: 'Device timeout' };
              }
              return { success: true, value: 100 + callCount };
            });

            const results = await client.readPropertySequential('192.168.1.100', 47808, requests);

            // Property: Result count should match request count
            expect(results.length).toBe(requests.length);

            // Results should have mixed success/failure status
            const successCount = results.filter((r) => r.success).length;
            const failureCount = results.filter((r) => !r.success).length;
            expect(successCount + failureCount).toBe(requests.length);
            expect(successCount).toBeGreaterThan(0);
            expect(failureCount).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should read each register individually with configured timeout', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 6: Sequential Fallback on Batch Failure
      // Validates: Requirements 5.1, 5.2, 5.3
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              objectInstance: fc.integer({ min: 0, max: 100 }),
              fieldName: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 8 }
          ),
          fc.integer({ min: 1000, max: 5000 }),
          async (registerConfigs, timeoutMs) => {
            const client = new BACnetClient({ sequentialReadTimeout: timeoutMs });
            const clientAny = client as any;

            const requests: BatchReadRequest[] = registerConfigs.map((config) => ({
              objectType: 'analogInput',
              objectInstance: config.objectInstance,
              propertyId: 'presentValue',
              fieldName: config.fieldName,
            }));

            // Mock readProperty to verify timeout is passed
            clientAny.readProperty = vi.fn(async (_ip: string, _port: number, _objectType: string, _objectInstance: number, _propertyId: string, passedTimeout?: number) => {
              // Verify timeout is passed correctly
              expect(passedTimeout).toBe(timeoutMs);
              return { success: true, value: 100 };
            });

            await client.readPropertySequential('192.168.1.100', 47808, requests);

            // Verify readProperty was called for each request
            expect(clientAny.readProperty).toHaveBeenCalledTimes(requests.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
