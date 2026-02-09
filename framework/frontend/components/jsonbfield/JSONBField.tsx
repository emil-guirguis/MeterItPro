/**
 * JSONB Field Component
 * 
 * A reusable form field component for handling JSONB data types.
 * Integrates @microlink/react-json-view with BaseForm.
 * Supports multiple data structures: nested objects, flat arrays, key-value pairs, and permissions.
 */

import React, { useEffect, useState, Suspense } from 'react';
const JsonView = React.lazy(() => import('@microlink/react-json-view'));
import {
  Box,
  Typography,
  Paper,
  Alert,
} from '@mui/material';

export interface JSONBFieldProps {
  name: string;
  label: string;
  value: any;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  onChange: (value: any) => void;
  onBlur?: () => void;
  jsonbConfig?: JSONBConfig;
}

export interface JSONBConfig {
  type?: 'nested-object' | 'flat-array' | 'key-value' | 'permissions' | 'auto';
  groupBy?: string;
  itemLabel?: string;
  itemDescription?: string;
  allowAdd?: boolean;
  allowRemove?: boolean;
  allowEdit?: boolean;
  customValidator?: (value: any) => string | null;
  moduleOrder?: string[];
  moduleNames?: Record<string, string>;
  actionNames?: Record<string, string>;
  collapsed?: boolean;
  collapseStringsAfterLength?: number;
  displayDataTypes?: boolean;
  enableClipboard?: boolean;
  quotesOnKeys?: boolean;
  sortKeys?: boolean;
  theme?: 'default' | 'dark';
}

/**
 * Deserialize JSONB data from various formats
 */
function deserializeJSONB(value: any): any {
  if (value === null || value === undefined) {
    return {};
  }

  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn('Failed to parse JSONB string:', e);
      return {};
    }
  }

  // If it's already an object or array, return as-is
  if (typeof value === 'object') {
    return value;
  }

  return {};
}

/**
 * JSONBField Component
 * 
 * Renders a JSONB field with @microlink/react-json-view
 */
export const JSONBField: React.FC<JSONBFieldProps> = ({
  name,
  label,
  value,
  error,
  disabled = false,
  required = false,
  description,
  onBlur,
  jsonbConfig,
}) => {
  const [deserializedValue, setDeserializedValue] = useState<any>(() =>
    deserializeJSONB(value)
  );

  // Update deserialized value when prop changes
  useEffect(() => {
    setDeserializedValue(deserializeJSONB(value));
  }, [value]);

  const displayError = error;

  return (
    <Box
      key={name}
      className="jsonb-field"
      sx={{
        mb: 2,
      }}
    >
      {/* Label */}
      <Typography
        variant="subtitle1"
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

      {/* JSON View */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: displayError ? 'error.main' : 'divider',
          borderRadius: 1,
          overflow: 'auto',
          maxHeight: '400px',
        }}
        onMouseLeave={() => {
          onBlur?.();
        }}
      >
        {deserializedValue !== undefined && deserializedValue !== null ? (
          <Suspense fallback={<Typography variant="body2">Loading JSON viewer...</Typography>}>
            <JsonView
              {...{
                src: deserializedValue,
                shouldExpandNode: () => !jsonbConfig?.collapsed,
                collapseStringsAfterLength:
                  jsonbConfig?.collapseStringsAfterLength ?? 50,
                displayDataTypes: jsonbConfig?.displayDataTypes ?? true,
                enableClipboard: jsonbConfig?.enableClipboard ?? true,
                quotesOnKeys: jsonbConfig?.quotesOnKeys ?? true,
                sortKeys: jsonbConfig?.sortKeys ?? false,
                theme: jsonbConfig?.theme as any ?? 'default',
              } as any}
            />
          </Suspense>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No data
          </Typography>
        )}
      </Paper>

      {/* Error Message */}
      {displayError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {displayError}
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

export default JSONBField;
