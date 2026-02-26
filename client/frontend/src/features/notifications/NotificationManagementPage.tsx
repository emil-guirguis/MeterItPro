import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import NotificationListPanel from './NotificationListPanel';
import NotificationSettingsForm from './NotificationSettingsForm';
import { useNotificationsEnhanced } from './notificationsStore';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export const NotificationManagementPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { clearAll, list } = useNotificationsEnhanced();
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearAll();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="page-content">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="h5">Notifications</Typography>

        {tab === 0 && list.total > 0 && (
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          aria-label="notification management tabs"
        >
          <Tab label={list.total > 0 ? `Active (${list.total})` : 'Active'} />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <NotificationListPanel />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <NotificationSettingsForm />
      </TabPanel>
    </div>
  );
};

export default NotificationManagementPage;
