/**
 * NotificationList Component
 *
 * Renders a list of notifications with details and clear actions
 */

import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { Notification, NotificationSeverity, NotificationType } from '../../types/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
  notifications: Notification[];
  onClear: (notificationId: string) => void;
  onAcknowledge?: (notificationId: string) => void;
  onClearAll?: () => void;
}

const getSeverityColor = (severity: NotificationSeverity): 'error' | 'warning' | 'info' => {
  if (severity === 'error') return 'error';
  if (severity === 'warning') return 'warning';
  return 'info';
};

const getTypeLabel = (type: NotificationType): string => {
  if (type === 'stale' || type === 'meter_no_reading') return 'No Readings';
  if (type === 'all_zero' || type === 'meter_zero_reading') return 'Zero Readings';
  if (type === 'demand_threshold') return 'Demand';
  return 'Error';
};

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onClear,
  onAcknowledge
}) => {
  const formatTimestamp = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  return (
    <List sx={{ width: '100%', maxHeight: 400, overflow: 'auto' }}>
      {notifications.map((notification, index) => (
        <React.Fragment key={notification.id}>
          <ListItem
            data-testid={`notification-item-${notification.id}`}
            sx={{
              py: 1.5,
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {notification.title}
                  </Typography>
                  <Chip
                    label={getTypeLabel(notification.notification_type)}
                    size="small"
                    color={getSeverityColor(notification.severity)}
                    variant="outlined"
                  />
                  {notification.status === 'acknowledged' && (
                    <Chip
                      label="Acked"
                      size="small"
                      color="default"
                      variant="outlined"
                      data-testid={`acked-chip-${notification.id}`}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  {notification.description && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      {notification.description}
                    </Typography>
                  )}
                  {(notification.meter_id || notification.meter_element_id) && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      {notification.meter_id && `Meter: ${notification.meter_id}`}
                      {notification.meter_id && notification.meter_element_id && ' · '}
                      {notification.meter_element_id && `Element: ${notification.meter_element_id}`}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" color="textSecondary">
                    {formatTimestamp(notification.created_at)}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              {onAcknowledge && notification.status !== 'acknowledged' && (
                <IconButton
                  edge="end"
                  aria-label="acknowledge"
                  title="Acknowledge — stop repeat emails"
                  onClick={() => onAcknowledge(notification.id)}
                  size="small"
                  data-testid={`ack-notification-${notification.id}`}
                >
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => onClear(notification.id)}
                size="small"
                data-testid={`clear-notification-${notification.id}`}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          {index < notifications.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default NotificationList;
