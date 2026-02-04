/**
 * Simple integration test for the MCP Worker Thread
 * This tests the basic functionality of the worker thread wrapper
 */

import { ThreadManager } from './ThreadManager.js';
import { createLogger } from './worker-logger.js';

const logger = createLogger('test-integration');

async function testWorkerIntegration() {
  logger.info('Starting MCP Worker Thread integration test...');
  
  const threadManager = new ThreadManager({
    maxRestartAttempts: 3,
    restartDelay: 1000,
    healthCheckInterval: 5000,
    messageTimeout: 10000
  });

  try {
    // Test 1: Start worker thread
    logger.info('Test 1: Starting worker thread...');
    await threadManager.startWorker();
    logger.info('✅ Worker thread started successfully');

    // Test 2: Check worker status
    logger.info('Test 2: Checking worker status...');
    const status = await threadManager.getWorkerStatus();
    logger.info('✅ Worker status retrieved:', status);

    // Test 3: Send a simple message
    logger.info('Test 3: Sending ping message...');
    const pingResponse = await threadManager.sendMessage({
      type: 'ping',
      requestId: 'test-ping-1'
    });
    logger.info('✅ Ping response received:', pingResponse);

    // Test 4: Start MCP server in worker
    logger.info('Test 4: Starting MCP server in worker...');
    const startResponse = await threadManager.sendMessage({
      type: 'start',
      requestId: 'test-start-1'
    });
    logger.info('✅ MCP server start response:', startResponse);

    // Test 5: Get MCP server status
    logger.info('Test 5: Getting MCP server status...');
    const mcpStatus = await threadManager.sendMessage({
      type: 'status',
      requestId: 'test-status-1'
    });
    logger.info('✅ MCP server status:', mcpStatus);

    // Test 6: Test data request
    logger.info('Test 6: Testing data request...');
    const dataResponse = await threadManager.sendMessage({
      type: 'data',
      payload: {
        action: 'get_status'
      },
      requestId: 'test-data-1'
    });
    logger.info('✅ Data request response:', dataResponse);

    // Test 7: Stop MCP server
    logger.info('Test 7: Stopping MCP server...');
    const stopResponse = await threadManager.sendMessage({
      type: 'stop',
      requestId: 'test-stop-1'
    });
    logger.info('✅ MCP server stop response:', stopResponse);

    logger.info('🎉 All tests passed successfully!');

  } catch (error) {
    logger.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    logger.info('Cleaning up worker thread...');
    await threadManager.stopWorker();
    logger.info('✅ Cleanup complete');
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testWorkerIntegration()
    .then(() => {
      logger.info('Integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Integration test failed:', error);
      process.exit(1);
    });
}

export { testWorkerIntegration };