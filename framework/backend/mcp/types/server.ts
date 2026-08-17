/**
 * MCP Server type definitions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import winston from 'winston';

export interface MCPServerConfig {
  name: string;
  version: string;
  logger?: winston.Logger;
  capabilities?: {
    tools?: {};
    resources?: {};
    prompts?: {};
  };
}

export interface MCPServerInfo {
  name: string;
  version: string;
  capabilities: string[];
}

export interface MCPServerStatus {
  isRunning: boolean;
  isConnected: boolean;
  toolCount: number;
  resourceCount: number;
  uptime: number;
}

export interface MCPLifecycleHooks {
  onStart?: () => Promise<void>;
  onStop?: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  onToolCall?: (toolName: string, args: any) => Promise<void>;
}
