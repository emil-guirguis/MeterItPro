/**
 * Permission type placeholder.
 * Projects must define their own permission system and provide it to the framework.
 * 
 * Example:
 * ```typescript
 * export type Permission = 'user:create' | 'user:read' | 'user:update' | 'user:delete';
 * ```
 */
export type Permission = string;

/**
 * Auth context interface for permission checking.
 */
export interface AuthContext {
  checkPermission: (permission: Permission) => boolean;
}

/**
 * User interface placeholder.
 * Projects should define their own User type.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}
