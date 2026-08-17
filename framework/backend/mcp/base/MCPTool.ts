/**
 * Base MCP Tool Class
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MCPToolConfig, MCPToolResult } from '../types/tool.js';

export class MCPTool {
  protected config: MCPToolConfig;

  constructor(config: MCPToolConfig) {
    this.config = config;
  }

  getName(): string {
    return this.config.name;
  }

  getDefinition(): Tool {
    return {
      name: this.config.name,
      description: this.config.description,
      inputSchema: this.config.inputSchema,
    };
  }

  async execute(args: any): Promise<MCPToolResult> {
    if (this.config.validate) {
      const validation = await this.config.validate(args);
      if (!validation.valid) {
        return {
          content: [
            {
              type: 'text',
              text: `Validation failed: ${validation.errors?.join(', ')}`,
            },
          ],
          isError: true,
        };
      }
    }

    return await this.config.handler(args);
  }
}
