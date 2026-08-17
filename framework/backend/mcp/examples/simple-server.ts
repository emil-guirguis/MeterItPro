#!/usr/bin/env node
/**
 * Simple MCP Server Example
 */

import { MCPServer } from '../base/MCPServer.js';
import { MCPTool } from '../base/MCPTool.js';

const echoTool = new MCPTool({
  name: 'echo',
  description: 'Echo back the input message',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Message to echo',
      },
    },
    required: ['message'],
  },
  handler: async (args) => {
    return {
      content: [
        {
          type: 'text',
          text: `Echo: ${args.message}`,
        },
      ],
    };
  },
});

const server = new MCPServer({
  name: 'simple-mcp-server',
  version: '1.0.0',
});

server.registerTool(echoTool);

// Start server (uncomment when running in Node.js environment)
// server.start().catch(console.error);
// process.on('SIGINT', () => server.stop().then(() => process.exit(0)));
