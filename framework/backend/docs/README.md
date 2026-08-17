# Framework Backend Documentation

This directory contains the shared backend framework for building consistent APIs and MCP servers.

## Structure

The framework is organized by feature domain:

- **shared/** - Cross-domain utilities and types
- **api/** - REST API base classes, middleware, and utilities
- **mcp/** - MCP server base classes and utilities

## Usage

Import framework components using the barrel exports:

```typescript
// Import from specific domain
import { BaseRouter, BaseController } from '../../../framework/backend/api';

// Import from root (all domains)
import { BaseRouter, MCPServer } from '../../../framework/backend';
```

## Documentation

- [API Framework Guide](./API_GUIDE.md)
- [MCP Server Guide](./MCP_SERVER_GUIDE.md)

## Requirements

- Node.js 18+
- TypeScript 5.0+
- Express 4+ (for API framework)
- @modelcontextprotocol/sdk (for MCP framework)
