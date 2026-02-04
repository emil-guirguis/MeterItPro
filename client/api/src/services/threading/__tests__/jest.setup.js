/**
 * Jest setup file for threading tests
 */

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MODBUS_IP = '10.10.10.22';
  process.env.MODBUS_PORT = '502';
  process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
});

// Global test cleanup
afterAll(() => {
  // Clean up any global resources
});

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create mock configurations
  createMockConfig: (overrides = {}) => ({
    database: {
      url: 'postgresql://localhost:5432/test',
      database: 'test',
      table: 'meter_reading'
    },
    collectionInterval: 900000,
    autoStart: false,
    ...overrides
  }),

  // Helper to create mock logger
  createMockLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }),

  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock worker responses
  createMockResponse: (type, payload = {}, requestId = 'test-123') => ({
    type,
    payload,
    requestId,
    timestamp: new Date().toISOString()
  })
};