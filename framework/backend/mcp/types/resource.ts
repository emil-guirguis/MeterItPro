/**
 * MCP Resource type definitions
 */

export interface MCPResourceConfig {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  handler: () => Promise<MCPResourceContent>;
  cacheable?: boolean;
  cacheDuration?: number;
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface MCPResourceMetadata {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  size?: number;
  lastModified?: Date;
}

export interface MCPResourceListItem {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}
