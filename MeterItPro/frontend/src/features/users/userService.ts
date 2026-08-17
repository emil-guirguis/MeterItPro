import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { User } from '../../types/auth';

// API base URL - this would typically come from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class UserService {
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

  // Get all users with filtering and pagination
  async getUsers(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    'filter.role'?: string;
    'filter.status'?: string;
  }): Promise<{
    items: User[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = await this.apiClient.get('/users', { params });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch users';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get user by ID
  async getUser(id: string): Promise<User> {
    try {
      const response: AxiosResponse<{ success: boolean; data: User }> = await this.apiClient.get(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch user';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Create new user
  async createUser(userData: Partial<User> & { password: string }): Promise<User> {
    try {
      const response: AxiosResponse<{ success: boolean; data: User }> = await this.apiClient.post('/users', userData);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to create user';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Update user
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const response: AxiosResponse<{ success: boolean; data: User }> = await this.apiClient.put(`/users/${id}`, userData);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to update user';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Change user password
  async changePassword(id: string, password: string, currentPassword?: string): Promise<void> {
    try {
      const data: any = { password };
      if (currentPassword) {
        data.currentPassword = currentPassword;
      }
      
      await this.apiClient.put(`/users/${id}/password`, data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to change password';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`/users/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to delete user';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;