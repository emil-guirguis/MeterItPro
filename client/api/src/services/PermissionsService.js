/**
 * PermissionsService
 * Centralized service for managing role-to-permission mappings
 * Provides methods to generate, validate, and convert permissions between formats
 */

class PermissionsService {
  /**
   * Define all available modules in the system
   */
  static MODULES = ['user', 'meter', 'device', 'location', 'contact', 'template', 'settings'];

  /**
   * Define all available actions per module
   */
  static ACTIONS = {
    user: ['create', 'read', 'update', 'delete'],
    meter: ['create', 'read', 'update', 'delete'],
    device: ['create', 'read', 'update', 'delete'],
    location: ['create', 'read', 'update', 'delete'],
    contact: ['create', 'read', 'update', 'delete'],
    template: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update']
  };

  /**
   * Role-to-permission mappings as nested objects
   * Format: { module: { action: boolean } }
   * 
   * Organized by role with clear module grouping for maintainability
   */
  static ROLE_PERMISSIONS = {
    admin: {
      // Full access to all user management
      user: { create: true, read: true, update: true, delete: true },
      // Full access to all meter operations
      meter: { create: true, read: true, update: true, delete: true },
      // Full access to all device operations
      device: { create: true, read: true, update: true, delete: true },
      // Full access to all location operations
      location: { create: true, read: true, update: true, delete: true },
      // Full access to all contact operations
      contact: { create: true, read: true, update: true, delete: true },
      // Full access to all template operations
      template: { create: true, read: true, update: true, delete: true },
      // Full access to settings
      settings: { read: true, update: true }
    },
    manager: {
      // Can manage users but cannot delete
      user: { create: true, read: true, update: true, delete: false },
      // Full access to meter operations
      meter: { create: true, read: true, update: true, delete: true },
      // Full access to device operations
      device: { create: true, read: true, update: true, delete: true },
      // Full access to location operations
      location: { create: true, read: true, update: true, delete: true },
      // Full access to contact operations
      contact: { create: true, read: true, update: true, delete: true },
      // Full access to template operations
      template: { create: true, read: true, update: true, delete: true },
      // Can read and update settings
      settings: { read: true, update: true }
    },
    technician: {
      // Read-only access to users
      user: { create: false, read: true, update: false, delete: false },
      // Full access to meter operations
      meter: { create: true, read: true, update: true, delete: true },
      // Full access to device operations
      device: { create: true, read: true, update: true, delete: true },
      // Read-only access to locations
      location: { create: false, read: true, update: false, delete: false },
      // Read-only access to contacts
      contact: { create: false, read: true, update: false, delete: false },
      // Read-only access to templates
      template: { create: false, read: true, update: false, delete: false },
      // Read-only access to settings
      settings: { read: true, update: false }
    },
    viewer: {
      // Read-only access to all resources
      user: { create: false, read: true, update: false, delete: false },
      meter: { create: false, read: true, update: false, delete: false },
      device: { create: false, read: true, update: false, delete: false },
      location: { create: false, read: true, update: false, delete: false },
      contact: { create: false, read: true, update: false, delete: false },
      template: { create: false, read: true, update: false, delete: false },
      // Read-only access to settings
      settings: { read: true, update: false }
    }
  };

  /**
   * Get permissions object for a given role
   * @param {string} role - User role (admin, manager, technician, viewer)
   * @returns {Object} Nested permissions object { module: { action: boolean } }
   */
  static getPermissionsByRole(role) {
    const normalizedRole = (role || 'viewer').toLowerCase();
    
    // Return role permissions or default to viewer
    if (this.ROLE_PERMISSIONS[normalizedRole]) {
      return JSON.parse(JSON.stringify(this.ROLE_PERMISSIONS[normalizedRole]));
    }
    
    return JSON.parse(JSON.stringify(this.ROLE_PERMISSIONS.viewer));
  }

  /**
   * Convert nested permissions object to flat array format
   * @param {Object} permissionsObj - Nested permissions object
   * @returns {Array<string>} Flat array of permissions (e.g., ['user:create', 'meter:read'])
   */
  static toFlatArray(permissionsObj) {
    if (!permissionsObj || typeof permissionsObj !== 'object') {
      return [];
    }

    const flatArray = [];
    
    for (const [module, actions] of Object.entries(permissionsObj)) {
      if (typeof actions === 'object' && actions !== null) {
        for (const [action, allowed] of Object.entries(actions)) {
          if (allowed === true) {
            flatArray.push(`${module}:${action}`);
          }
        }
      }
    }
    
    return flatArray;
  }

  /**
   * Convert flat array format to nested permissions object
   * @param {Array<string>} flatArray - Flat array of permissions
   * @returns {Object} Nested permissions object
   */
  static toNestedObject(flatArray) {
    if (!Array.isArray(flatArray)) {
      return {};
    }

    const nestedObj = {};
    
    // Initialize all modules with all actions set to false
    for (const module of this.MODULES) {
      nestedObj[module] = {};
      for (const action of this.ACTIONS[module] || []) {
        nestedObj[module][action] = false;
      }
    }
    
    // Set permissions from flat array
    for (const permission of flatArray) {
      const [module, action] = permission.split(':');
      if (module && action && nestedObj[module] && action in nestedObj[module]) {
        nestedObj[module][action] = true;
      }
    }
    
    return nestedObj;
  }

  /**
   * Validate permissions object structure
   * @param {Object} permissionsObj - Permissions object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static validatePermissionsObject(permissionsObj) {
    if (!permissionsObj || typeof permissionsObj !== 'object' || Array.isArray(permissionsObj)) {
      return false;
    }

    // Check that all required modules are present
    for (const module of this.MODULES) {
      if (!(module in permissionsObj)) {
        return false;
      }

      const actions = permissionsObj[module];
      if (typeof actions !== 'object' || actions === null || Array.isArray(actions)) {
        return false;
      }

      // Check that all required actions for this module are present
      const expectedActions = this.ACTIONS[module] || [];
      for (const action of expectedActions) {
        if (!(action in actions)) {
          return false;
        }

        if (typeof actions[action] !== 'boolean') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get all available modules
   * @returns {Array<string>} List of module names
   */
  static getAvailableModules() {
    return [...this.MODULES];
  }

  /**
   * Get all available actions for a module
   * @param {string} module - Module name
   * @returns {Array<string>} List of action names
   */
  static getAvailableActions(module) {
    if (module in this.ACTIONS) {
      return [...this.ACTIONS[module]];
    }
    return [];
  }

  /**
   * Get all available roles
   * @returns {Array<string>} List of role names
   */
  static getAvailableRoles() {
    return Object.keys(this.ROLE_PERMISSIONS);
  }

  /**
   * Format permissions for UI display with grouped modules
   * Returns an array of permission groups organized by module
   * @param {Object} permissionsObj - Nested permissions object
   * @returns {Array<Object>} Array of module groups with their permissions
   * 
   * Example output:
   * [
   *   {
   *     module: 'user',
   *     label: 'User Management',
   *     permissions: [
   *       { action: 'create', label: 'Create', allowed: true },
   *       { action: 'read', label: 'Read', allowed: true },
   *       ...
   *     ]
   *   },
   *   ...
   * ]
   */
  static formatPermissionsForUI(permissionsObj) {
    if (!permissionsObj || typeof permissionsObj !== 'object') {
      return [];
    }

    const moduleLabels = {
      user: 'User Management',
      meter: 'Meter Management',
      device: 'Device Management',
      location: 'Location Management',
      contact: 'Contact Management',
      template: 'Template Management',
      settings: 'Settings'
    };

    const actionLabels = {
      create: 'Create',
      read: 'Read',
      update: 'Update',
      delete: 'Delete'
    };

    const groups = [];

    for (const module of this.MODULES) {
      if (module in permissionsObj) {
        const actions = permissionsObj[module];
        const permissions = [];

        for (const action of (this.ACTIONS[module] || [])) {
          if (action in actions) {
            permissions.push({
              action,
              label: actionLabels[action] || action,
              allowed: actions[action] === true
            });
          }
        }

        groups.push({
          module,
          label: moduleLabels[module] || module,
          permissions
        });
      }
    }

    return groups;
  }

  /**
   * Get a summary of permissions for a role
   * Returns a human-readable summary of what a role can do
   * @param {string} role - User role
   * @returns {Object} Summary with role info and permission counts
   */
  static getPermissionsSummary(role) {
    const permissions = this.getPermissionsByRole(role);
    const flatArray = this.toFlatArray(permissions);
    
    const summary = {
      role,
      totalPermissions: flatArray.length,
      byModule: {}
    };

    for (const module of this.MODULES) {
      const modulePerms = flatArray.filter(p => p.startsWith(`${module}:`));
      summary.byModule[module] = {
        count: modulePerms.length,
        permissions: modulePerms
      };
    }

    return summary;
  }
}

module.exports = PermissionsService;
