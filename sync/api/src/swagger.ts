import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MeterIt Pro Sync API',
      version: '1.0.0',
      description: 'Backend API for MeterIt Pro Sync Service - Local data management and synchronization',
      contact: {
        name: 'MeterIt Pro Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Local development server',
      },
      {
        url: 'http://127.0.0.1:3002',
        description: 'Local development server (127.0.0.1)',
      },
    ],
    components: {
      schemas: {
        Tenant: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'integer',
              description: 'Unique tenant identifier',
            },
            name: {
              type: 'string',
              description: 'Company name',
            },
            url: {
              type: 'string',
              description: 'Company website URL',
            },
            street: {
              type: 'string',
              description: 'Street address',
            },
            street2: {
              type: 'string',
              description: 'Additional street address',
            },
            city: {
              type: 'string',
              description: 'City',
            },
            state: {
              type: 'string',
              description: 'State/Province',
            },
            zip: {
              type: 'string',
              description: 'Postal code',
            },
            country: {
              type: 'string',
              description: 'Country',
            },
            active: {
              type: 'boolean',
              description: 'Whether tenant is active',
            },
            api_key: {
              type: 'string',
              description: 'API key for authentication',
            },
          },
          required: ['tenant_id', 'name'],
        },
        Meter: {
          type: 'object',
          properties: {
            meter_id: {
              type: 'integer',
              description: 'Unique meter identifier',
            },
            device_id: {
              type: 'integer',
              description: 'Associated device ID',
            },
            ip: {
              type: 'string',
              description: 'Meter IP address',
            },
            port: {
              type: 'integer',
              description: 'Meter port',
            },
            element: {
              type: 'string',
              description: 'Meter element',
            },
            active: {
              type: 'boolean',
              description: 'Whether meter is active',
            },
          },
        },
        MeterReading: {
          type: 'object',
          properties: {
            meter_reading_id: {
              type: 'integer',
              description: 'Unique reading identifier',
            },
            meter_id: {
              type: 'integer',
              description: 'Associated meter ID',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Reading timestamp',
            },
            active_energy: {
              type: 'number',
              description: 'Active energy reading',
            },
            power: {
              type: 'number',
              description: 'Power reading',
            },
            voltage_p_n: {
              type: 'number',
              description: 'Phase-to-neutral voltage',
            },
          },
        },
        SyncStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              description: 'Overall sync status',
            },
            queue_size: {
              type: 'integer',
              description: 'Number of pending sync operations',
            },
            last_sync: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of last successful sync',
            },
            sync_errors: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Recent sync errors',
            },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'error'],
              description: 'Health status',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Check timestamp',
            },
          },
        },
      },
    },
  },
  apis: ['./src/server.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
