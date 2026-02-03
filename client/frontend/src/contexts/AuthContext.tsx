import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, AuthState, LoginCredentials, User, UserRole } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';
import { authService } from '../services/authService';

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  locations: [],
};

// Auth actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; locations: any[] } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { user: User; locations: any[] } }
  | { type: 'REFRESH_TOKEN_FAILURE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOCATIONS'; payload: any[] };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        locations: action.payload.locations,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        locations: [],
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        locations: [],
      };
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        locations: action.payload.locations,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'REFRESH_TOKEN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        locations: [],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOCATIONS':
      return {
        ...state,
        locations: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const logs: string[] = [];
      const addLog = (msg: string) => {
        console.log(msg);
        logs.push(msg);
        localStorage.setItem('auth_debug_logs', JSON.stringify(logs));
      };

      addLog('🔄 Initializing authentication...');
      addLog('📍 Current URL: ' + window.location.href);
      addLog('🗄️ LocalStorage explicit_logout: ' + localStorage.getItem('explicit_logout'));
      addLog('🗄️ LocalStorage auth_token: ' + (localStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING'));
      addLog('🗄️ SessionStorage auth_token: ' + (sessionStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING'));
      
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Check if user explicitly logged out - FIRST priority
        if (authService.hasLogoutFlag()) {
          addLog('🚪 User explicitly logged out, clearing any remaining tokens and skipping auto-login');
          // Ensure tokens are cleared even if logout didn't complete properly
          authService.clearStoredToken();
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
        
        // Dev auto-login (local only)
        const autoLoginEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTO_LOGIN === 'true';
        const devEmail = import.meta.env.VITE_DEV_EMAIL as string | undefined;
        const devPassword = import.meta.env.VITE_DEV_PASSWORD as string | undefined;

        if (autoLoginEnabled && !authService.getStoredToken() && devEmail && devPassword) {
          addLog('⚙️ Dev auto-login enabled, attempting login...');
          try {
            await login({ email: devEmail, password: devPassword, rememberMe: true });
            addLog('✅ Dev auto-login succeeded');
            return;
          } catch (autoLoginError) {
            addLog('❌ Dev auto-login failed: ' + (autoLoginError instanceof Error ? autoLoginError.message : String(autoLoginError)));
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
          }
        }

        // Check if user has a stored token
        const token = authService.getStoredToken();
        addLog('🔑 Stored token exists: ' + !!token);
        addLog('🔑 Token value: ' + (token ? token.substring(0, 50) + '...' : 'null'));
        
        if (token) {
          addLog('✅ Token found in storage, verifying with backend...');
          try {
            // Verify token with backend to get user data
            let user = await authService.verifyToken();
            // Normalize permissions shape if backend returned nested object
            const normalizePermissions = (perms: any) => {
              if (!perms) return [];
              if (Array.isArray(perms)) return perms;
              if (typeof perms === 'object') {
                const result: string[] = [];
                Object.entries(perms).forEach(([moduleName, actions]) => {
                  if (typeof actions === 'object' && actions !== null) {
                    Object.entries(actions).forEach(([actionName, allowed]) => {
                      if (allowed) {
                        result.push(`${moduleName}:${actionName}`);
                      }
                    });
                  }
                });
                return result;
              }
              return [];
            };
            if (user && user.permissions) {
              (user as any).permissions = normalizePermissions((user as any).permissions);
            }
            addLog('✅ Verify endpoint response: ' + JSON.stringify(user));
            if (user) {
              addLog('✅ Token verified, user authenticated: ' + user.email);
              dispatch({ 
                type: 'LOGIN_SUCCESS', 
                payload: {
                  user,
                  locations: []
                }
              });
            } else {
              addLog('❌ Token verification returned null user');
              authService.clearStoredToken();
              dispatch({ type: 'SET_LOADING', payload: false });
            }
          } catch (verifyError) {
            addLog('❌ Token verification error: ' + (verifyError instanceof Error ? verifyError.message : String(verifyError)));
            addLog('❌ Error details: ' + JSON.stringify({
              message: verifyError instanceof Error ? verifyError.message : String(verifyError),
              stack: verifyError instanceof Error ? verifyError.stack : 'no stack'
            }));
            authService.clearStoredToken();
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          addLog('ℹ️ No stored token, user not authenticated');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        addLog('❌ Auth initialization error: ' + (error instanceof Error ? error.message : String(error)));
        authService.clearStoredToken();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | undefined;

    if (state.isAuthenticated) {
      // Refresh token every 14 minutes (assuming 15-minute token expiry)
      refreshInterval = setInterval(async () => {
        try {
          await refreshToken();
        } catch (error: unknown) {
          console.error('Automatic token refresh failed:', error);
          // If refresh fails, logout user
          logout();
        }
      }, 14 * 60 * 1000); // 14 minutes
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.isAuthenticated]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      console.log('🚀 Starting login process in AuthContext...');
      dispatch({ type: 'LOGIN_START' });
      
      const authResponse = await authService.login(credentials);
      console.log('📦 Auth response received in AuthContext:', authResponse);
      console.log('📦 Auth response locations:', authResponse.locations);
      
      // Tokens are already stored in authService.login()
      console.log('🔑 Token in storage after login:', authService.getStoredToken() ? 'EXISTS' : 'MISSING');
      
      console.log('📋 [AUTH] User permissions from backend:', authResponse.user.permissions);
      console.log('📋 [AUTH] User role from backend:', authResponse.user.role);
      
      // Ensure locations are included in the response
      const locations = authResponse.locations || [];
      console.log('📍 [AUTH] Locations to store:', locations.length, 'locations');
        // Normalize permissions if necessary
        const normalizePermissions = (perms: any) => {
          if (!perms) return [];
          if (Array.isArray(perms)) return perms;
          if (typeof perms === 'object') {
            const result: string[] = [];
            Object.entries(perms).forEach(([moduleName, actions]) => {
              if (typeof actions === 'object' && actions !== null) {
                Object.entries(actions).forEach(([actionName, allowed]) => {
                  if (allowed) {
                    result.push(`${moduleName}:${actionName}`);
                  }
                });
              }
            });
            return result;
          }
          return [];
        };

        const normalizedUser = {
          ...authResponse.user,
          permissions: normalizePermissions(authResponse.user.permissions),
        };

        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: {
            user: normalizedUser,
            locations: locations
          }
        });
      console.log('✅ Login completed successfully in AuthContext');
    } catch (error) {
      console.error('❌ Login failed in context:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    try {
      console.log('🚪 Logging out user...');
      
      // Clear stored tokens FIRST
      authService.clearStoredToken();
      console.log('🗑️ Tokens cleared');
      
      // Set logout flag to prevent auto-login
      authService.setLogoutFlag();
      console.log('🚩 Logout flag set');
      
      // Dispatch logout to clear state
      dispatch({ type: 'LOGOUT' });
      console.log('✅ Logout state updated');
      
      // Call logout API if needed (don't wait for it)
      authService.logout().catch((error: unknown) => {
        console.error('Logout API call failed:', error);
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still dispatch logout to clear local state
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      const refreshTokenValue = authService.getStoredRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const authResponse = await authService.refreshToken(refreshTokenValue);
      
      // Update stored tokens
      authService.storeTokens(authResponse.token, authResponse.refreshToken, authResponse.expiresIn);
      
      // Normalize permissions for refreshed user
      const normalizePermissions = (perms: any) => {
        if (!perms) return [];
        if (Array.isArray(perms)) return perms;
        if (typeof perms === 'object') {
          const result: string[] = [];
          Object.entries(perms).forEach(([moduleName, actions]) => {
            if (typeof actions === 'object' && actions !== null) {
              Object.entries(actions).forEach(([actionName, allowed]) => {
                if (allowed) {
                  result.push(`${moduleName}:${actionName}`);
                }
              });
            }
          });
          return result;
        }
        return [];
      };

      const normalizedUser = {
        ...authResponse.user,
        permissions: normalizePermissions(authResponse.user.permissions),
      };

      dispatch({ 
        type: 'REFRESH_TOKEN_SUCCESS', 
        payload: {
          user: normalizedUser,
          locations: authResponse.locations || []
        }
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'REFRESH_TOKEN_FAILURE' });
      throw error;
    }
  };

  // Check if user has specific permission
  const checkPermission = (permission?: string): boolean => {
    if (!permission) return true;
    if (!state.user) {
      console.warn('[AUTH] checkPermission: No user in state');
      return false;
    }
    
    // Handle permissions as array (normal case)
    if (Array.isArray(state.user.permissions)) {
      if (state.user.permissions.length === 0) {
        console.warn('[AUTH] checkPermission: User has no permissions', {
          permission,
          userRole: state.user.role,
          permissionsArray: state.user.permissions
        });
        return false;
      }
      
      const hasPermission = state.user.permissions.includes(permission);
      if (hasPermission) return true;

      // Fallback: if user's role grants the permission, allow it (backend may omit explicit perms)
      try {
        const rolePerms = ROLE_PERMISSIONS[(state.user as any).role as UserRole];
        if (rolePerms && Array.isArray(rolePerms) && rolePerms.includes(permission as any)) {
          console.log('[AUTH] checkPermission: Permission granted via role mapping', { permission, userRole: state.user.role });
          return true;
        }
      } catch (e) {
        // ignore and continue to other fallbacks
      }

      // Try common normalization alternatives (singular/plural mismatches)
      const [module, action] = (permission || '').split(':');
      if (module && action) {
        const altCandidates: string[] = [];
        // pluralize
        if (!module.endsWith('s')) altCandidates.push(`${module}s:${action}`);
        // singularize
        if (module.endsWith('s')) altCandidates.push(`${module.replace(/s$/, '')}:${action}`);
        // namespace fallback: try prefixing with 'core' or 'app' (some backends use namespacing)
        altCandidates.push(`${module}:*`);

        for (const alt of altCandidates) {
          if (state.user.permissions.includes(alt)) {
            console.log('[AUTH] checkPermission: Permission granted via alternative match', { permission, alt, userRole: state.user.role });
            return true;
          }
        }
      }

      console.warn('[AUTH] checkPermission: Permission denied', {
        permission,
        userPermissions: state.user.permissions,
        userRole: state.user.role
      });
      return false;
    }
    
    // Handle permissions as nested object: { module: { action: boolean } }
    if (typeof state.user.permissions === 'object' && state.user.permissions !== null) {
      console.log('[AUTH] checkPermission: Permissions is nested object, checking format', {
        permission,
        permissionsKeys: Object.keys(state.user.permissions)
      });
      
      // Parse permission string: "module:action"
      const [module, action] = permission.split(':');
      
      if (!module || !action) {
        console.warn('[AUTH] checkPermission: Invalid permission format (expected "module:action")', {
          permission
        });
        return false;
      }
      
      // Check if module exists and action is true
      const permissionsObj = state.user.permissions as Record<string, Record<string, boolean>>;
      let hasPermission = permissionsObj[module]?.[action] === true;
      // Try pluralization fallback if module key not found
      if (!hasPermission) {
        const pluralKey = module.endsWith('s') ? module : `${module}s`;
        const singularKey = module.endsWith('s') ? module.replace(/s$/, '') : module;
        if (permissionsObj[pluralKey]?.[action] === true) hasPermission = true;
        if (!hasPermission && permissionsObj[singularKey]?.[action] === true) hasPermission = true;
      }
      
      if (!hasPermission) {
        console.warn('[AUTH] checkPermission: Permission denied', {
          permission,
          module,
          action,
          moduleExists: !!permissionsObj[module],
          actionValue: permissionsObj[module]?.[action],
          userRole: state.user.role
        });
      } else {
        console.log('[AUTH] checkPermission: Permission granted', {
          permission,
          module,
          action
        });
      }
      return hasPermission;
    }
    
    console.warn('[AUTH] checkPermission: Permissions in unexpected format', {
      permission,
      permissionsType: typeof state.user.permissions,
      permissions: state.user.permissions
    });
    return false;
  };

  // Check if user has specific role
  const hasRole = (role: UserRole): boolean => {
    if (!state.user) return false;
    return state.user.role === role;
  };

  // Get locations for a specific tenant
  const getLocationsByTenant = (tenantId: string | number): any[] => {
    console.log(`[AUTH] getLocationsByTenant(${tenantId}): state.locations.length=${state.locations?.length}`);
    
    if (!state.locations || state.locations.length === 0) {
      console.log('[AUTH] getLocationsByTenant: No locations in state');
      console.log('[AUTH] Full state:', { 
        user: state.user?.email, 
        isAuthenticated: state.isAuthenticated,
        locationsCount: state.locations?.length,
        locationsArray: state.locations
      });
      return [];
    }
    
    console.log(`[AUTH] getLocationsByTenant(${tenantId}): Checking ${state.locations.length} locations`);
    console.log('[AUTH] Location objects:', state.locations.map((loc: any) => ({
      location_id: loc.location_id,
      name: loc.name,
      tenant_id: loc.tenant_id,
      keys: Object.keys(loc)
    })));
    
    // Filter locations by tenant_id (handle both string and number comparisons)
    const filtered = state.locations.filter((location: any) => {
      const locationTenantId = String(location.tenant_id);
      const searchTenantId = String(tenantId);
      const matches = locationTenantId === searchTenantId;
      console.log(`[AUTH]   Location ${location.id}: tenant_id=${location.tenant_id} vs search=${tenantId} => ${matches}`);
      return matches;
    });
    
    console.log(`[AUTH] getLocationsByTenant(${tenantId}): Found ${filtered.length} locations out of ${state.locations.length}`);
    return filtered;
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    checkPermission,
    hasRole,
    getLocationsByTenant,
  };

  // Log locations in memory whenever they change
  React.useEffect(() => {
    if (state.locations && state.locations.length > 0) {
      console.log('📍 LOCATIONS IN MEMORY:', state.locations);
      console.log('📍 LOCATIONS COUNT:', state.locations.length);
      state.locations.forEach((loc: any, idx: number) => {
        console.log(`  [${idx}] ID: ${loc.id}, Name: ${loc.name}, Tenant: ${loc.tenant_id}`);
      });
    } else {
      console.log('📍 NO LOCATIONS IN MEMORY');
    }
  }, [state.locations]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;