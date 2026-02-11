import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import HealthyIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastCheck: Date;
  responseTime?: number;
}

interface SystemMetrics {
  emailsSentToday: number;
  templatesActive: number;
  errorRate: number;
  avgResponseTime: number;
}

export const SystemHealth: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthStatus();
    const interval = setInterval(loadHealthStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async () => {
    try {
      const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Threading health
      const [healthRes, statusRes, statsRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/threading/health`, { headers }),
        fetch(`${API_BASE_URL}/threading/status`, { headers }),
        fetch(`${API_BASE_URL}/threading/stats`, { headers })
      ]);

      const services: HealthStatus[] = [];

      // Threading health summary
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const json = await healthRes.value.json();
        const overall = json?.data?.overall === 'healthy' ? 'healthy' : 'error';
        const responseTime = json?.data?.health?.lastResponseTime || json?.data?.health?.responseTime;
        services.push({
          service: 'Threading Service',
          status: overall,
          message: overall === 'healthy' ? 'Threading system is healthy' : 'Threading system reports issues',
          lastCheck: new Date(json?.data?.lastCheck || Date.now()),
          responseTime: typeof responseTime === 'number' ? responseTime : undefined
        });
      } else {
        services.push({
          service: 'Threading Service',
          status: 'error',
          message: 'Failed to fetch threading health',
          lastCheck: new Date()
        });
      }

      // Optional: include message/error stats when available
      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        const json = await statusRes.value.json();
        const errorsCount = (json?.data?.errors?.length ?? 0);
        if (errorsCount > 0) {
          services.push({
            service: 'Threading Errors',
            status: 'warning',
            message: `${errorsCount} recent errors reported`,
            lastCheck: new Date(json?.data?.timestamp || Date.now())
          });
        }
      }

      setHealthStatus(services);

      // Try to compute high-level metrics from stats when available
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const json = await statsRes.value.json();
        const perf = json?.data?.performance || {};
        const msgs = json?.data?.messages || {};
        const errs = json?.data?.errors || {};
        const totalMsgs = msgs.total ?? msgs.count ?? 0;
        const totalErrs = errs.total ?? errs.count ?? 0;
        const avgRt = perf.avgResponseTime ?? perf.averageResponseTime ?? undefined;
        setMetrics({
          emailsSentToday: 0, // Not available from threading stats
          templatesActive: 0, // Not available here
          errorRate: totalMsgs > 0 ? Math.round((totalErrs / totalMsgs) * 1000) / 10 : 0,
          avgResponseTime: typeof avgRt === 'number' ? Math.round(avgRt) : 0
        });
      } else {
        // If no metrics endpoint or failed, hide metrics
        setMetrics(null);
      }
    } catch (error) {
      console.error('Failed to load health status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getOverallStatus = () => {
    const hasError = healthStatus.some(s => s.status === 'error');
    const hasWarning = healthStatus.some(s => s.status === 'warning');
    
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'healthy';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>System Health</Typography>
        <LinearProgress />
      </Box>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Health Monitor
      </Typography>

      {/* Overall Status */}
      <Alert 
        severity={overallStatus === 'healthy' ? 'success' : overallStatus === 'warning' ? 'warning' : 'error'}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6">
          System Status: {overallStatus.toUpperCase()}
        </Typography>
        <Typography variant="body2">
          {overallStatus === 'healthy' 
            ? 'All systems operating normally'
            : overallStatus === 'warning'
            ? 'Some services have warnings - monitoring required'
            : 'Critical issues detected - immediate attention required'
          }
        </Typography>
      </Alert>

      {/* Metrics Cards */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {metrics.emailsSentToday.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Emails Sent Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {metrics.templatesActive}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Templates
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color={metrics.errorRate > 5 ? "error.main" : "warning.main"}>
                  {metrics.errorRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Error Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {metrics.avgResponseTime}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Service Health Status */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Service Health Status
        </Typography>
        
        <Grid container spacing={2}>
          {healthStatus.map((service, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getStatusIcon(service.status)}
                    <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                      {service.service}
                    </Typography>
                    <Chip 
                      label={service.status.toUpperCase()} 
                      color={getStatusColor(service.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {service.message}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Last check: {service.lastCheck.toLocaleTimeString()}
                    </Typography>
                    {service.responseTime && (
                      <Typography variant="caption" color="text.secondary">
                        {service.responseTime}ms
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};