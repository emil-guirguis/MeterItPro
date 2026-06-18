/**
 * JSONB Permissions Renderer
 * 
 * Specialized renderer for permissions JSONB field.
 * Displays permissions as checkboxes grouped by module.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';

export interface JSONBPermissionsRendererProps {
  name: string;
  label: string;
  value: any;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  onChange: (value: any) => void;
  moduleOrder?: string[];
  moduleNames?: Record<string, string>;
  actionNames?: Record<string, string>;
}

/**
 * Convert nested object permissions to flat array format
 * { user: { create: true }, meter: { read: true } } -> ['user:create', 'meter:read']
 */
function nestedToFlat(nested: Record<string, Record<string, boolean>>): string[] {
  const flat: string[] = [];

  Object.entries(nested).forEach(([module, actions]) => {
    Object.entries(actions).forEach(([action, enabled]) => {
      if (enabled) {
        flat.push(`${module}:${action}`);
      }
    });
  });

  return flat;
}

/**
 * Deserialize permissions from various formats
 */
function deserializePermissions(value: any): string[] {
  if (!value) {
    return [];
  }

  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (typeof parsed === 'object') {
        return nestedToFlat(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse permissions:', e);
      return [];
    }
  }

  // If it's an array, return as-is
  if (Array.isArray(value)) {
    return value;
  }

  // If it's an object, convert to flat array
  if (typeof value === 'object') {
    return nestedToFlat(value);
  }

  return [];
}

/**
 * Serialize permissions to flat array format
 */
function serializePermissions(permissions: string[]): string {
  return JSON.stringify(permissions);
}

/**
 * JSONBPermissionsRenderer Component
 * 
 * Renders permissions as checkboxes grouped by module
 */
export const JSONBPermissionsRenderer: React.FC<JSONBPermissionsRendererProps> = ({
  name,
  label,
  value,
  error,
  disabled = false,
  required = false,
  description,
  onChange,
  moduleOrder = ['dashboard', 'user', 'location', 'contact', 'meter', 'device', 'template', 'report', 'settings', 'notification_rule'],
  moduleNames = {
    dashboard: 'Dashboard',
    user: 'User',
    location: 'Location',
    contact: 'Contact',
    meter: 'Meter',
    device: 'Device',
    settings: 'Settings',
    template: 'Email Templates',
    report: 'Reports',
    notification_rule: 'Notification Rules',
  },
  actionNames = {},
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() =>
    deserializePermissions(value)
  );

  // Update when prop changes
  useEffect(() => {
    setSelectedPermissions(deserializePermissions(value));
  }, [value]);

  // Format action name for display
  const formatActionName = (action: string): string => {
    if (actionNames[action]) {
      return actionNames[action];
    }
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  // Handle checkbox change
  const handlePermissionChange = (permission: string, checked: boolean) => {
    let newPermissions: string[];

    if (checked) {
      newPermissions = [...selectedPermissions, permission];
    } else {
      newPermissions = selectedPermissions.filter((p) => p !== permission);
    }

    setSelectedPermissions(newPermissions);
    onChange(serializePermissions(newPermissions));
  };

  // Get all available permissions from the Permission enum
  // For now, we'll generate them from the selected permissions and common patterns
  const getAllPermissions = () => {
    const allPerms: Record<string, string[]> = {};
    const commonActions = ['create', 'read', 'update', 'delete'];

    // Add all modules from moduleOrder
    moduleOrder.forEach((module) => {
      allPerms[module] = commonActions.map((action) => `${module}:${action}`);
    });

    return allPerms;
  };

  const allPermissions = getAllPermissions();

  return (
    <Box
      key={name}
      className="permissions-field"
      sx={{ mb: 1 }}
    >
      {/* Label */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          mb: 1,
        }}
      >
        {label}
        {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            mb: 1,
          }}
        >
          {description}
        </Typography>
      )}

      {/* Permissions Container */}
      <Box className="permissions-container">
        {moduleOrder.map((module) => {
          const permissions = allPermissions[module];
          if (!permissions) return null;

          return (
            <Paper
              key={module}
              className="permission-group"
              elevation={0}
              sx={{
                p: 1.5,
                mb: 1,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              {/* Module Header */}
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  pb: 0.75,
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  color: 'text.primary',
                  fontSize: '0.8rem',
                }}
              >
                {moduleNames[module] || module}
              </Typography>

              {/* Permission Checkboxes */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(4, 1fr)',
                  },
                  gap: 0,
                }}
                className="permission-group-items"
              >
                {permissions.map((permission) => {
                  const [, action] = permission.split(':');
                  return (
                    <FormControlLabel
                      key={permission}
                      control={
                        <Checkbox
                          checked={selectedPermissions.includes(permission)}
                          onChange={(e) =>
                            handlePermissionChange(permission, e.target.checked)
                          }
                          disabled={disabled}
                          size="small"
                          sx={{
                            py: 0.25,
                            '&.Mui-checked': {
                              color: 'primary.main',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {formatActionName(action)}
                        </Typography>
                      }
                      sx={{
                        m: 0,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderRadius: 0.5,
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {/* Disabled State */}
      {disabled && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            mt: 1,
          }}
        >
          This field is read-only
        </Typography>
      )}
    </Box>
  );
};

export default JSONBPermissionsRenderer;
