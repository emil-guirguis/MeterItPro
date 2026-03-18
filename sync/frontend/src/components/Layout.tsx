import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Tooltip,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SpeedIcon from '@mui/icons-material/Speed';
import { useAppStore } from '../stores/useAppStore';
import './Layout.css';

const drawerWidth = 240;

const menuItems = [
  { text: 'Sync Status', icon: <SyncIcon />, path: '/sync-status' },
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantInfo } = useAppStore();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <SpeedIcon sx={{ fontSize: 24 }} />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
            MeterIT Sync
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => {
              // Disable Dashboard tab if no tenant is connected
              const isDisabled = item.path === '/dashboard' && !tenantInfo;
              
              return (
                <ListItem key={item.text} disablePadding>
                  <Tooltip 
                    title={isDisabled ? 'Connect your account first' : ''} 
                    placement="right"
                  >
                    <span className="layout-tooltip-wrapper">
                      <ListItemButton
                        selected={location.pathname === item.path}
                        onClick={() => !isDisabled && navigate(item.path)}
                        disabled={isDisabled}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                    </span>
                  </Tooltip>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
