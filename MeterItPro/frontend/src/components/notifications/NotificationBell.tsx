/**
 * NotificationBell Component
 * 
 * Displays notification count badge and provides access to notification list
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import type { Notification } from '../../types/notifications';
import { notificationService } from '../../services/notificationService';
import NotificationList from './NotificationList';

interface NotificationBellProps {
  refreshInterval?: number; // in milliseconds, default 60000
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  refreshInterval = 60000
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const t0 = performance.now();
      console.log('[NotificationBell] Fetching notifications...');
      const result = await notificationService.listNotifications(100, 0);
      console.log(`[NotificationBell] Fetch done in ${(performance.now() - t0).toFixed(0)}ms — ${result.total} total`);
      setNotifications(result.notifications);
      setCount(result.total);
    } catch (err) {
      console.error('[NotificationBell] Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update count
  const updateCount = useCallback(async () => {
    try {
      const newCount = await notificationService.getNotificationCount();
      setCount(newCount);
    } catch (err) {
      console.error('Error updating notification count:', err);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchNotifications();

    // Set up polling
    const pollInterval = setInterval(() => {
      updateCount();
    }, refreshInterval);

    return () => clearInterval(pollInterval);
  }, [fetchNotifications, updateCount, refreshInterval]);

  // Handle bell click
  const handleBellClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setIsOpen(true);
    fetchNotifications();
  };

  // Handle close
  const handleClose = () => {
    setAnchorEl(null);
    setIsOpen(false);
  };

  // Handle clear individual notification
  const handleClearNotification = async (notificationId: string) => {
    try {
      await notificationService.clearNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setCount(Math.max(0, count - 1));
    } catch (err) {
      console.error('Error clearing notification:', err);
      setError('Failed to clear notification');
    }
  };

  // Handle acknowledge notification — keeps it in the list, marks acked
  const handleAcknowledge = async (notificationId: string) => {
    try {
      await notificationService.acknowledgeNotification(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, status: 'acknowledged' as const } : n
      ));
    } catch (err) {
      console.error('Error acknowledging notification:', err);
      setError('Failed to acknowledge notification');
    }
  };

  // Handle clear all notifications
  const handleClearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setCount(0);
      handleClose();
    } catch (err) {
      console.error('Error clearing all notifications:', err);
      setError('Failed to clear all notifications');
    }
  };

  return (
    <>
      {/* Bell Icon with Badge */}
      <IconButton
        color="inherit"
        onClick={handleBellClick}
        aria-label="notifications"
        data-testid="notification-bell-button"
      >
        <Badge badgeContent={count} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Popover with Notification List */}
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        data-testid="notification-popover"
      >
        <Box sx={{ width: 400, maxHeight: 500, p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Notifications ({count})
            </Typography>
            {count > 0 && (
              <Button
                size="small"
                color="error"
                onClick={handleClearAll}
                data-testid="clear-all-button"
              >
                Clear All
              </Button>
            )}
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* Notification List */}
          {!isLoading && (
            <>
              {notifications.length === 0 ? (
                <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                  No notifications
                </Typography>
              ) : (
                <NotificationList
                  notifications={notifications}
                  onClear={handleClearNotification}
                  onAcknowledge={handleAcknowledge}
                  onClearAll={handleClearAll}
                />
              )}
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
