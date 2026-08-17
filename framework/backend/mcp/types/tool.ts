/**
 * MCP Tool type definitions
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface MCPToolConfig {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<MCPToolResult>;
  validate?: (args: any) => Promise<ValidationResult>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export type { ValidationResult as McpToolValidationResult };

export interface MCPToolMetadata {
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  examples?: Array<{
    description: string;
    input: any;
    output: any;
  }>;
}
