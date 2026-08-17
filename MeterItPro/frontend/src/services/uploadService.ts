import { authService } from './authService';

export interface UploadResponse {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

class UploadService {
  private baseUrl = '/api/upload';

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = authService.getStoredToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Request failed');
    }

    if (!result.success) {
      throw new Error(result.message || 'Operation failed');
    }

    return result.data;
  }

  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    return this.makeRequest<UploadResponse>('/image', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadImageFromBase64(base64Data: string, filename: string): Promise<UploadResponse> {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Create file from blob
    const file = new File([blob], filename, { type: blob.type });
    
    return this.uploadImage(file);
  }

  async deleteImage(filename: string): Promise<void> {
    await this.makeRequest<void>(`/image/${filename}`, {
      method: 'DELETE',
    });
  }

  // Utility function to extract filename from URL
  getFilenameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1] || null;
    } catch {
      return null;
    }
  }

  // Utility function to check if URL is a base64 data URL
  isBase64DataUrl(url: string): boolean {
    return url.startsWith('data:image/');
  }

  // Utility function to check if URL is an uploaded file URL
  isUploadedFileUrl(url: string): boolean {
    return url.includes('/uploads/');
  }
}

export const uploadService = new UploadService();