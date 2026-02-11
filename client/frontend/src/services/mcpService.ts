import axios from 'axios';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class MCPService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor to include auth token
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Call an MCP tool via the threading service
   */
  async callMCPTool(toolName: string, args: any = {}): Promise<any> {
    try {
      const response = await this.apiClient.post('/threading/message', {
        type: 'tool_call',
        payload: {
          tool: toolName,
          arguments: args
        },
        priority: 'high',
        timeout: 10000 // 10 second timeout
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data.response
        };
      } else {
        throw new Error(response.data.message || 'MCP tool call failed');
      }
    } catch (error) {
      console.error(`MCP tool call failed for ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Read current meter data directly from the live meter via MCP agent
   */
  async readCurrentMeterData(): Promise<any> {
    return this.callMCPTool('read_current_meter_data');
  }

  /**
   * Get the latest reading from database via MCP agent
   */
  async getLatestReading(): Promise<any> {
    return this.callMCPTool('get_latest_reading');
  }

  /**
   * Get meter statistics via MCP agent
   */
  async getMeterStatistics(hours: number = 24): Promise<any> {
    return this.callMCPTool('get_meter_statistics', { hours });
  }

  /**
   * Test connections via MCP agent
   */
  async testConnections(): Promise<any> {
    return this.callMCPTool('test_connections');
  }

  /**
   * Get collection status from MCP agent
   */
  async getCollectionStatus(): Promise<any> {
    return this.callMCPTool('get_collection_status');
  }

  /**
   * Start data collection via MCP agent
   */
  async startDataCollection(): Promise<any> {
    return this.callMCPTool('start_data_collection');
  }

  /**
   * Stop data collection via MCP agent
   */
  async stopDataCollection(): Promise<any> {
    return this.callMCPTool('stop_data_collection');
  }
}

export const mcpService = new MCPService();
export default mcpService;