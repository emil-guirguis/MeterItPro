/**
 * JSONB Field Component
 * 
 * A reusable form field component for handling JSONB data types.
 * Integrates @microlink/react-json-view with BaseForm.
 * Supports multiple data structures: nested objects, flat arrays, key-value pairs, and permissions.
 */

import React, { useEffect, useState } from 'react';
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

// Native recursive JSON renderer — no external library needed
const JsonNode: React.FC<{ value: any; depth: number; collapsed: boolean }> = ({ value, depth, collapsed }) => {
  const [open, setOpen] = useState(!collapsed || depth === 0);

  if (value === null) return <span style={{ color: '#999' }}>null</span>;
  if (typeof value === 'boolean') return <span style={{ color: '#9C27B0' }}>{String(value)}</span>;
  if (typeof value === 'number') return <span style={{ color: '#1565C0' }}>{value}</span>;
  if (typeof value === 'string') return <span style={{ color: '#C62828' }}>"{value}"</span>;

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as any[]).map((v, i) => [String(i), v] as [string, any])
    : Object.entries(value as object);

  const [open_, close_] = isArray ? ['[', ']'] : ['{', '}'];

  if (entries.length === 0) return <span>{open_}{close_}</span>;

  if (!open) {
    return (
      <span
        onClick={() => setOpen(true)}
        style={{ cursor: 'pointer', color: '#666', userSelect: 'none' }}
      >
        {open_}
        <span style={{ fontStyle: 'italic' }}>
          {isArray ? ` ${entries.length} items ` : ` ${entries.length} keys `}
        </span>
        {close_}
      </span>
    );
  }

  return (
    <span>
      <span onClick={() => setOpen(false)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        {open_}
      </span>
      <div style={{ paddingLeft: 16, borderLeft: '1px solid #e0e0e0', marginLeft: 4 }}>
        {entries.map(([key, val], i) => (
          <div key={key} style={{ lineHeight: 1.6 }}>
            {!isArray && <span style={{ color: '#5D4037' }}>"{key}": </span>}
            <JsonNode value={val} depth={depth + 1} collapsed={collapsed} />
            {i < entries.length - 1 && ','}
          </div>
        ))}
      </div>
      {close_}
    </span>
  );
};

/**
 * JSONBField Component
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
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            <JsonNode value={deserializedValue} depth={0} collapsed={jsonbConfig?.collapsed ?? false} />
          </pre>
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
