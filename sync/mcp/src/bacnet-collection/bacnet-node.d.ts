/**
 * Type declarations for bacnet-node library
 * bacnet-node doesn't provide official TypeScript types, so we define them here
 */

declare module 'bacnet-node' {
  class BACnetClient {
    constructor(options?: {
      apduTimeout?: number;
      interface?: string;
      port?: number;
    });

    readProperty(
      address: string,
      objectId: { type: number; instance: number },
      propertyId: number,
      callback: (error: Error | null, value: any) => void
    ): void;

    readPropertyMultiple(
      address: string,
      requests: Array<{
        objectId: { type: number; instance: number };
        properties: Array<{ id: number }>;
      }>,
      callback: (error: Error | null, data: any) => void
    ): void;

    whoIs(lowLimit?: number, highLimit?: number): void;

    reinitializeDevice(
      receiver: string,
      state: number,
      options: { password?: string },
      next: (err: Error | null) => void
    ): void;
    reinitializeDevice(
      receiver: string,
      state: number,
      next: (err: Error | null) => void
    ): void;

    close(): void;

    on(event: 'iAm' | 'error', callback: (data: any) => void): void;
  }

  export default BACnetClient;
}
