/**
 * BACnet client wrapper for communication with BACnet devices
 * Uses bacnet-node library with support for batch property reads
 */

import bacnet from 'bacnet-node';
import { BACnetReadResult } from './types.js';

// MaxSegmentsAccepted.SEGMENTS_65 (>64 segments) = 0b111 << 4 = 0x70
// Must be passed to readPropertyMultiple so the device knows we accept segmented responses.
// Without this, devices abort large responses and bacnet-node times out instead of surfacing the error.
const MAX_SEGMENTS_ACCEPTED = 0x70;

/**
 * Maps BACnet object type names to numeric IDs
 */
const OBJECT_TYPE_MAP: Record<string, number> = {
  analogInput: 0,
  analogOutput: 1,
  analogValue: 2,
  binaryInput: 3,
  binaryOutput: 4,
  binaryValue: 5,
  multiStateInput: 13,
  multiStateOutput: 14,
  multiStateValue: 19,
};

/**
 * Maps BACnet property names to numeric IDs
 */
const PROPERTY_ID_MAP: Record<string, number> = {
  presentValue: 85,
  units: 117,
  status: 112,
  description: 28,
  objectName: 77,
  objectType: 79,
  deviceType: 30,
};

export interface BatchReadRequest {
  objectType: string;
  objectInstance: number;
  propertyId: string;
  fieldName?: string;
}

export interface BatchReadResult {
  success: boolean;
  objectType: string;
  objectInstance: number;
  propertyId: string;
  fieldName?: string;
  value?: any;
  error?: string;
}

export class BACnetClient {
  private client: any = null;
  private readonly bacnetInterface: string;
  private readonly bacnetPort: number;
  private readonly apduTimeout: number;

  constructor(bacnetInterface: string = '0.0.0.0', bacnetPort: number = 47808, apduTimeout: number = 6000) {
    this.bacnetInterface = bacnetInterface;
    this.bacnetPort = bacnetPort;
    this.apduTimeout = apduTimeout;
    this.initializeClient();
  }

  /**
   * Initialize the BACnet client
   */
  private initializeClient(): void {
    if (!this.client) {
      this.client = new bacnet({
        apduTimeout: this.apduTimeout,
        interface: this.bacnetInterface,
        port: this.bacnetPort,
      });

      // Setup error handler
      this.client.on('error', (error: Error) => {
        console.error('BACnet client error:', error);
      });

      // Setup device discovery listener
      this.client.on('iAm', (device: any) => {
        console.log('BACnet device discovered:', {
          address: device.address,
          deviceId: device.deviceId,
          maxApdu: device.maxApdu,
          vendorId: device.vendorId,
        });
      });

      console.log('BACnet client initialized', {
        interface: this.bacnetInterface,
        port: this.bacnetPort,
        apduTimeout: this.apduTimeout,
      });
    }
  }

  /**
   * Convert object type name to numeric ID
   */
  private getObjectTypeId(objectType: string): number {
    const id = OBJECT_TYPE_MAP[objectType];
    if (id === undefined) {
      throw new Error(`Unknown object type: ${objectType}`);
    }
    return id;
  }

  /**
   * Convert property name to numeric ID
   */
  private getPropertyId(propertyId: string): number {
    const id = PROPERTY_ID_MAP[propertyId];
    if (id === undefined) {
      throw new Error(`Unknown property: ${propertyId}`);
    }
    return id;
  }

  /**
   * Read a single BACnet property
   */
  async readProperty(
    ip: string,
    port: number,
    objectType: string,
    objectInstance: number,
    propertyId: string,
    timeoutMs: number
  ): Promise<BACnetReadResult> {
    try {
      const objectTypeId = this.getObjectTypeId(objectType);
      const propertyIdNum = this.getPropertyId(propertyId);
      // Note: bacnet-node doesn't use port in the address
      // The port is configured at client initialization
      const address = ip;

      return new Promise((resolve) => {
        const effectiveTimeout = Math.max(timeoutMs, this.apduTimeout);
        const timeoutHandle = setTimeout(() => {
          console.error(
            `BACnet read timeout for ${address}, object ${objectType}:${objectInstance}, property ${propertyId} after ${effectiveTimeout}ms`
          );
          resolve({
            success: false,
            error: `Read timeout after ${effectiveTimeout}ms`,
          });
        }, effectiveTimeout);

        try {
          this.client.readProperty(
            address,
            { type: objectTypeId, instance: objectInstance },
            propertyIdNum,
            (error: Error | null, value: any) => {
              clearTimeout(timeoutHandle);

              if (error) {
                console.error(`BACnet read error for ${address}:`, error.message);
                resolve({
                  success: false,
                  error: error.message,
                });
                return;
              }

              if (value !== undefined && value !== null) {
                console.log(
                  `BACnet read successful: ${address} ${objectType}:${objectInstance} ${propertyId} = ${value}`
                );
                resolve({
                  success: true,
                  value: value,
                });
              } else {
                console.error(`BACnet read returned empty value for ${address}`);
                resolve({
                  success: false,
                  error: 'Empty response from device',
                });
              }
            }
          );
        } catch (err) {
          clearTimeout(timeoutHandle);
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`BACnet read exception for ${address}:`, errorMsg);
          resolve({
            success: false,
            error: errorMsg,
          });
        }
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`BACnet read error:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Read multiple properties from a device in a single batch request
   * This is much more efficient than reading properties one at a time
   */
  async readPropertyMultiple(
    ip: string,
    port: number,
    requests: BatchReadRequest[],
    timeoutMs: number
  ): Promise<BatchReadResult[]> {
    try {
      // Note: bacnet-node doesn't use port in the address for readPropertyMultiple
      // The port is configured at client initialization
      const address = ip;

      // Convert requests to node-bacnet format
      const bacnetRequests = requests.map((req) => ({
        objectId: {
          type: this.getObjectTypeId(req.objectType),
          instance: req.objectInstance,
        },
        properties: [
          {
            id: this.getPropertyId(req.propertyId),
          },
        ],
      }));

      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔴 BREAKPOINT: BACnet readPropertyMultiple`);
      console.log(`   Address: ${address}`);
      console.log(`   Total requests: ${requests.length}`);
      console.log(`   First 3 requests:`);
      bacnetRequests.slice(0, 3).forEach((req: any, idx: number) => {
        console.log(`     Request ${idx + 1}:`);
        console.log(`       objectId.type: ${req.objectId.type} (analogInput)`);
        console.log(`       objectId.instance: ${req.objectId.instance}`);
        console.log(`       properties[0].id: ${req.properties[0].id} (presentValue)`);
      });
      if (bacnetRequests.length > 3) {
        console.log(`   ... and ${bacnetRequests.length - 3} more requests`);
      }
      console.log(`${'='.repeat(80)}\n`);

      return new Promise((resolve) => {
        const effectiveTimeout = Math.max(timeoutMs, this.apduTimeout);
        const timeoutHandle = setTimeout(() => {
          console.error(
            `BACnet batch read timeout for ${address} (${requests.length} properties) after ${effectiveTimeout}ms`
          );
          resolve(
            requests.map((req) => ({
              success: false,
              objectType: req.objectType,
              objectInstance: req.objectInstance,
              propertyId: req.propertyId,
              fieldName: req.fieldName,
              error: `Batch read timeout after ${effectiveTimeout}ms`,
            }))
          );
        }, effectiveTimeout);

        try {
          this.client.readPropertyMultiple(address, bacnetRequests, { maxSegments: MAX_SEGMENTS_ACCEPTED }, (error: Error | null, data: any) => {
            clearTimeout(timeoutHandle);

            if (error) {
              console.error(`BACnet batch read error for ${address}:`, error.message);
              resolve(
                requests.map((req) => ({
                  success: false,
                  objectType: req.objectType,
                  objectInstance: req.objectInstance,
                  propertyId: req.propertyId,
                  fieldName: req.fieldName,
                  error: error.message,
                }))
              );
              return;
            }

            // Parse the response and map back to original requests
            const results: BatchReadResult[] = [];

            if (data && data.values && Array.isArray(data.values)) {
              data.values.forEach((item: any, index: number) => {
                const originalRequest = requests[index];

                if (item.values && item.values.length > 0) {
                  const readValue = item.values[0].value;
                  console.log(
                    `BACnet batch read successful: ${address} ${originalRequest.objectType}:${originalRequest.objectInstance} = ${readValue}`
                  );
                  results.push({
                    success: true,
                    objectType: originalRequest.objectType,
                    objectInstance: originalRequest.objectInstance,
                    propertyId: originalRequest.propertyId,
                    fieldName: originalRequest.fieldName,
                    value: readValue,
                  });
                } else {
                  console.warn(
                    `BACnet batch read returned empty value for ${originalRequest.objectType}:${originalRequest.objectInstance}`
                  );
                  results.push({
                    success: false,
                    objectType: originalRequest.objectType,
                    objectInstance: originalRequest.objectInstance,
                    propertyId: originalRequest.propertyId,
                    fieldName: originalRequest.fieldName,
                    error: 'Empty response from device',
                  });
                }
              });
            } else {
              console.error(`BACnet batch read returned invalid data structure for ${address}`);
              results.push(
                ...requests.map((req) => ({
                  success: false,
                  objectType: req.objectType,
                  objectInstance: req.objectInstance,
                  propertyId: req.propertyId,
                  fieldName: req.fieldName,
                  error: 'Invalid response structure',
                }))
              );
            }

            resolve(results);
          });
        } catch (err) {
          clearTimeout(timeoutHandle);
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`BACnet batch read exception for ${address}:`, errorMsg);
          resolve(
            requests.map((req) => ({
              success: false,
              objectType: req.objectType,
              objectInstance: req.objectInstance,
              propertyId: req.propertyId,
              fieldName: req.fieldName,
              error: errorMsg,
            }))
          );
        }
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`BACnet batch read error:`, errorMsg);
      return requests.map((req) => ({
        success: false,
        objectType: req.objectType,
        objectInstance: req.objectInstance,
        propertyId: req.propertyId,
        fieldName: req.fieldName,
        error: errorMsg,
      }));
    }
  }

  /**
   * Check if a BACnet device is reachable by attempting to read its Device object name.
   * Every BACnet device must expose objectType=8 (Device), property=77 (objectName).
   * Uses a short 2-second timeout so a dead device fails fast.
   */
  async checkConnectivity(ip: string, port: number, deviceId: number): Promise<boolean> {
    const CONNECTIVITY_TIMEOUT_MS = 5000;
    const address = `${ip}:${port}`;
    // objectType 8 = Device, property 77 = objectName
    const DEVICE_OBJECT_TYPE = 8;
    const OBJECT_NAME_PROPERTY = 77;

    return new Promise((resolve) => {
      const timeoutHandle = setTimeout(() => {
        console.error(`BACnet connectivity timeout for ${address} (device ${deviceId}) after ${CONNECTIVITY_TIMEOUT_MS}ms`);
        resolve(false);
      }, CONNECTIVITY_TIMEOUT_MS);

      try {
        this.client.readProperty(
          address,
          { type: DEVICE_OBJECT_TYPE, instance: deviceId },
          OBJECT_NAME_PROPERTY,
          (error: Error | null, value: any) => {
            clearTimeout(timeoutHandle);
            if (error) {
              console.error(`BACnet connectivity check failed for ${address} (device ${deviceId}):`, error.message);
              resolve(false);
            } else {
              console.log(`BACnet device ${deviceId} at ${address} is online`);
              resolve(true);
            }
          }
        );
      } catch (err) {
        clearTimeout(timeoutHandle);
        console.error(`BACnet connectivity check error for ${address}:`, err instanceof Error ? err.message : String(err));
        resolve(false);
      }
    });
  }

  /**
   * Send a ReinitializeDevice command to restart a BACnet device.
   * State 0 = COLDSTART (full restart), state 1 = WARMSTART.
   */
  async reinitializeDevice(ip: string, state: number = 0): Promise<{ success: boolean; error?: string }> {
    const REINIT_TIMEOUT_MS = 5000;
    return new Promise((resolve) => {
      const timeoutHandle = setTimeout(() => {
        console.error(`BACnet reinitializeDevice timeout for ${ip} after ${REINIT_TIMEOUT_MS}ms`);
        resolve({ success: false, error: `Reinitialize timeout after ${REINIT_TIMEOUT_MS}ms` });
      }, REINIT_TIMEOUT_MS);

      try {
        this.client.reinitializeDevice(ip, state, (err: Error | null) => {
          clearTimeout(timeoutHandle);
          if (err) {
            console.error(`BACnet reinitializeDevice error for ${ip}:`, err.message);
            resolve({ success: false, error: err.message });
          } else {
            console.log(`BACnet reinitializeDevice successful for ${ip}`);
            resolve({ success: true });
          }
        });
      } catch (err) {
        clearTimeout(timeoutHandle);
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`BACnet reinitializeDevice exception for ${ip}:`, errorMsg);
        resolve({ success: false, error: errorMsg });
      }
    });
  }

  /**
   * Send WhoIs broadcast to discover BACnet devices
   */
  whoIs(): void {
    try {
      this.client.whoIs();
      console.log('BACnet WhoIs broadcast sent');
    } catch (error) {
      console.error('Error sending WhoIs:', error);
    }
  }

  /**
   * Close BACnet connections gracefully
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        this.client.close();
        console.log('BACnet client closed successfully');
      } catch (error) {
        console.error('Error closing BACnet client:', error);
      } finally {
        this.client = null;
      }
    }
  }
}
