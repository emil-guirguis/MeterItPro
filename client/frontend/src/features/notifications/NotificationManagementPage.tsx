import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { FormModal } from '@meterit/framework-frontend/components/modal';
import NotificationListPanel from './NotificationListPanel';
import NotificationForm from './NotificationForm';
import { useNotificationsEnhanced } from './notificationsStore';

export const NotificationManagementPage: React.FC = () => {
  const notifications = useNotificationsEnhanced();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleCreateNotification = () => {
    setShowCreateForm(true);
  };

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await notifications.createItem(data);
      setShowCreateForm(false);
      await notifications.fetchItems();
    } catch (error) {
      console.error('Notification form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await notifications.clearAll();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="page-content">
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNotification}
        >
          Create Notification
        </Button>
        {notifications.list.total > 0 && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={clearing ? <CircularProgress size={14} /> : <DeleteSweepIcon />}
            onClick={handleClearAll}
            disabled={clearing}
          >
            Clear All
          </Button>
        )}
      </Box>

      <NotificationListPanel />

      {/* Create Modal */}
      {showCreateForm && (
        <FormModal
          isOpen={true}
          title="Notification"
          moduleIcon="notifications"
          crumb="Create Notification"
          onClose={handleFormCancel}
          onSubmit={() => {}}
          size="md"
          showSaveButton={false}
        >
          <NotificationForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={isSubmitting}
          />
        </FormModal>
      )}
    </div>
  );
};

export default NotificationManagementPage;
