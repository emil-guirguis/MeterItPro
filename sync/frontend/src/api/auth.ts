import axios from 'axios';

const CLIENT_API_URL = import.meta.env.VITE_CLIENT_API_URL || 'https://client.meterit.com/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token?: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: {
      users_id: number;
      email: string;
      name: string;
      status: string;
    };
    tenant?: {
      tenant_id: number;
      name: string;
      url?: string;
      street?: string;
      street2?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
  };
  error?: string;
}

const authClient = axios.create({
  baseURL: CLIENT_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  /**
   * Login with email and password
   * Returns user and tenant information if successful
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('🔐 [Auth] Attempting login for:', credentials.email);
      console.log('🔐 [Auth] API Base URL:', CLIENT_API_URL);
      console.log('🔐 [Auth] Full URL:', `${CLIENT_API_URL}/auth/login`);

      const response = await authClient.post<AuthResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      console.log('✅ [Auth] Login successful');
      
      // Validate response
      if (!response.data.success) {
        console.error('❌ [Auth] Login failed:', response.data.error);
        return {
          success: false,
          error: response.data.error || 'Login failed',
        };
      }

      // Check if user is active
      if (response.data.data?.user?.status !== 'active') {
        console.error('❌ [Auth] User is not active:', response.data.data?.user?.status);
        return {
          success: false,
          error: 'Your account is not active. Please contact support.',
        };
      }

      // Check if user has a tenant
      if (!response.data.data?.tenant?.tenant_id) {
        console.error('❌ [Auth] User has no associated tenant');
        return {
          success: false,
          error: 'Your account is not associated with a company. Please contact support.',
        };
      }

      console.log('📊 [Auth] User tenant:', response.data.data?.tenant);

      // Fetch full tenant data from company settings endpoint
      let fullTenantData = response.data.data?.tenant;
      if (response.data.data?.token) {
        try {
          console.log('📡 [Auth] Fetching full tenant data from company settings...');
          const settingsResponse = await authClient.get('/settings/company', {
            headers: {
              'Authorization': `Bearer ${response.data.data.token}`,
            },
          });

          if (settingsResponse.data?.data) {
            // Map settings data to tenant format
            fullTenantData = {
              ...response.data.data.tenant,
              url: settingsResponse.data.data.url,
              street: settingsResponse.data.data.street,
              street2: settingsResponse.data.data.street2,
              city: settingsResponse.data.data.city,
              state: settingsResponse.data.data.state,
              zip: settingsResponse.data.data.zip,
              country: settingsResponse.data.data.country,
              active: settingsResponse.data.data.active,
            };
            console.log('✅ [Auth] Full tenant data fetched:', fullTenantData);
          }
        } catch (err) {
          console.warn('⚠️ [Auth] Failed to fetch full tenant data, using basic info:', err);
          // Continue with basic tenant info if full fetch fails
        }
      }

      return {
        success: true,
        data: {
          user: response.data.data?.user,
          tenant: fullTenantData,
          token: response.data.data?.token,
          refreshToken: response.data.data?.refreshToken,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ [Auth] Login error:', {
          status: error.response?.status,
          message: error.message,
          code: error.code,
          data: error.response?.data,
        });

        // Handle SSL certificate errors
        if (error.code === 'ERR_CERT_COMMON_NAME_INVALID' || error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
          return {
            success: false,
            error: 'SSL certificate error. Please check the server configuration.',
          };
        }

        // Handle network errors
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          return {
            success: false,
            error: 'Network error. Please check your connection and the server URL.',
          };
        }

        if (error.response?.status === 401) {
          return {
            success: false,
            error: 'Invalid email or password',
          };
        }

        if (error.response?.status === 404) {
          return {
            success: false,
            error: 'User not found',
          };
        }

        return {
          success: false,
          error: error.response?.data?.error || error.message || 'Login failed. Please try again.',
        };
      }

      console.error('❌ [Auth] Unexpected error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  },
};
