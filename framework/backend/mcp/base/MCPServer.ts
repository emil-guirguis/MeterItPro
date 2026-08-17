/**
 * Base MCP Server Class
 * 
 * Note: This is a framework base class. The actual MCP SDK dependencies
 * should be installed in your project and passed to the initialization methods.
 */

import { MCPServerConfig, MCPLifecycleHooks } from '../types/server.js';

export class MCPServer {
  protected server: any;
  protected tools: Map<string, any>;
  protected logger: any;
  protected config: MCPServerConfig;
  protected hooks: MCPLifecycleHooks;
  protected startTime: number;

  constructor(config: MCPServerConfig, hooks: MCPLifecycleHooks = {}) {
    this.config = config;
    this.hooks = hooks;
    this.tools = new Map();
    this.startTime = Date.now();

    // Logger will be injected or created dynamically
    this.logger = config.logger || {
      info: console.log,
      error: console.error,
      debug: console.debug,
    };

    // Server will be created dynamically when SDK is available
    this.server = null;

    this.setupHandlers();
  }

  protected setupHandlers(): void {
    // Handlers will be set up when server is initialized
  }

  protected initializeServer(ServerClass: any, schemas: any): void {
    this.server = new ServerClass(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: this.config.capabilities || { tools: {} },
      }
    );

    this.server.setRequestHandler(schemas.ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()).map(tool => tool.getDefinition()),
      };
    });

    this.server.setRequestHandler(schemas.CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        if (this.hooks.onToolCall) {
          await this.hooks.onToolCall(name, args);
        }

        const tool = this.tools.get(name);
        if (!tool) {
          throw new Error(`Unknown tool: ${name}`);
        }

        return await tool.execute(args || {});
      } catch (error) {
        this.logger.error(`Tool execution error (${name}):`, error);
        
        if (this.hooks.onError) {
          await this.hooks.onError(error as Error);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  registerTool(tool: any): void {
    this.tools.set(tool.getName(), tool);
    this.logger.debug(`Registered tool: ${tool.getName()}`);
  }

  registerTools(tools: any[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  async start(TransportClass?: any): Promise<void> {
    try {
      if (!this.server) {
        throw new Error('Server not initialized. Call initializeServer() first or pass SDK classes to start()');
      }

      if (this.hooks.onStart) {
        await this.hooks.onStart();
      }

      const transport = TransportClass ? new TransportClass() : null;
      if (transport) {
        await this.server.connect(transport);
      }

      this.logger.info(`${this.config.name} v${this.config.version} started`);
      this.logger.info(`Registered ${this.tools.size} tools`);
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.hooks.onStop) {
        await this.hooks.onStop();
      }

      this.logger.info('Server stopped');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }
}
