import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios before importing the service
vi.mock('axios');

describe('DashboardService', () => {
  let mockGet: any;
  let mockPost: any;
  let mockPut: any;
  let mockDelete: any;
  let mockApiClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Create mock API client
    mockGet = vi.fn();
    mockPost = vi.fn();
    mockPut = vi.fn();
    mockDelete = vi.fn();

    mockApiClient = {
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    // Mock axios.create to return our mock client
    vi.mocked(axios.create).mockReturnValue(mockApiClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getMetersByTenant', () => {
    it('should call GET /dashboard/meters and return array of meters', async () => {
      // Import after mocking
      const { DashboardService } = await import('./dashboardService');
      
      const mockMeters = [
        { id: 1, name: 'Meter 1' },
        { id: 2, name: 'Meter 2' },
      ];

      mockGet.mockResolvedValue({
        data: {
          success: true,
          data: mockMeters,
        },
      });

      const service = new DashboardService();
      const result = await service.getMetersByTenant();

      expect(result).toEqual(mockMeters);
      expect(mockGet).toHaveBeenCalledWith('/dashboard/meters');
    });

    it('should return empty array on error', async () => {
      const { DashboardService } = await import('./dashboardService');
      
      mockGet.mockRejectedValue(new Error('Network error'));

      const service = new DashboardService();
      const result = await service.getMetersByTenant();

      expect(result).toEqual([]);
    });
  });

  describe('getMeterElementsByMeter', () => {
    it('should call GET /dashboard/meters/:meterId/elements and return array of elements', async () => {
      const { DashboardService } = await import('./dashboardService');
      
      const meterId = 1;
      const mockElements = [
        { id: 1, name: 'Phase A', meter_id: 1 },
        { id: 2, name: 'Phase B', meter_id: 1 },
      ];

      mockGet.mockResolvedValue({
        data: {
          success: true,
          data: mockElements,
        },
      });

      const service = new DashboardService();
      const result = await service.getMeterElementsByMeter(meterId);

      expect(result).toEqual(mockElements);
      expect(mockGet).toHaveBeenCalledWith(`/dashboard/meters/${meterId}/elements`);
    });

    it('should return empty array on error', async () => {
      const { DashboardService } = await import('./dashboardService');
      
      const meterId = 1;
      mockGet.mockRejectedValue(new Error('Network error'));

      const service = new DashboardService();
      const result = await service.getMeterElementsByMeter(meterId);

      expect(result).toEqual([]);
    });

    it('should pass meterId to the correct endpoint', async () => {
      const { DashboardService } = await import('./dashboardService');
      
      const meterId = 42;
      const mockElements = [{ id: 1, name: 'Element 1', meter_id: 42 }];

      mockGet.mockResolvedValue({
        data: {
          success: true,
          data: mockElements,
        },
      });

      const service = new DashboardService();
      await service.getMeterElementsByMeter(meterId);

      expect(mockGet).toHaveBeenCalledWith(`/dashboard/meters/${meterId}/elements`);
    });
  });
});
