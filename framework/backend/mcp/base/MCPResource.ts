/**
 * Base MCP Resource Class
 */

import { MCPResourceConfig, MCPResourceContent } from '../types/resource.js';

export class MCPResource {
  protected config: MCPResourceConfig;
  protected cache?: {
    content: MCPResourceContent;
    timestamp: number;
  };

  constructor(config: MCPResourceConfig) {
    this.config = config;
  }

  getUri(): string {
    return this.config.uri;
  }

  getName(): string {
    return this.config.name;
  }

  async getContent(): Promise<MCPResourceContent> {
    if (this.config.cacheable && this.cache) {
      const age = Date.now() - this.cache.timestamp;
      const maxAge = (this.config.cacheDuration || 60) * 1000;

      if (age < maxAge) {
        return this.cache.content;
      }
    }

    const content = await this.config.handler();

    if (this.config.cacheable) {
      this.cache = {
        content,
        timestamp: Date.now(),
      };
    }

    return content;
  }

  clearCache(): void {
    this.cache = undefined;
  }
}
