import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmailIcon from '@mui/icons-material/Email';
import SuccessIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { LoadingSpinner } from '@framework/components/common';
import { templateService } from '../../services/templateService';

interface TemplateStats {
  templateId: string;
  templateName: string;
  usageCount: number;
  successRate: number;
  lastUsed?: Date;
  category: string;
}

interface AnalyticsData {
  totalTemplates: number;
  totalEmailsSent: number;
  averageSuccessRate: number;
  topTemplates: TemplateStats[];
  recentActivity: Array<{
    templateName: string;
    emailsSent: number;
    date: Date;
  }>;
}

export const TemplateAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await templateService.getTemplateStats();
      const totalTemplates = stats.length;
      const totalEmailsSent = stats.reduce((sum, s) => sum + (s.usageCount || 0), 0);
      const averageSuccessRate = totalTemplates > 0
        ? Math.round((stats.reduce((sum, s) => sum + (s.successRate || 0), 0) / totalTemplates) * 10) / 10
        : 0;
      const topTemplates = [...stats]
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 5)
        .map(s => ({
          templateId: s.templateId,
          templateName: s.templateId,
          usageCount: s.usageCount,
          successRate: s.successRate,
          lastUsed: s.lastUsed ? new Date(s.lastUsed) : undefined,
          category: 'general'
        }));
      setAnalytics({
        totalTemplates,
        totalEmailsSent,
        averageSuccessRate,
        topTemplates,
        recentActivity: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meter_readings': return 'primary';
      case 'meter_errors': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No analytics data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Template Analytics
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Templates</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {analytics.totalTemplates}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Emails Sent</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {analytics.totalEmailsSent.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SuccessIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Success Rate</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {analytics.averageSuccessRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Failure Rate</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {(100 - analytics.averageSuccessRate).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Templates */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Templates
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Template Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Usage Count</TableCell>
                    <TableCell align="right">Success Rate</TableCell>
                    <TableCell>Last Used</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.topTemplates.map((template) => (
                    <TableRow key={template.templateId}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {template.templateName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={template.category.replace(/_/g, ' ')}
                          color={getCategoryColor(template.category) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {template.usageCount.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {template.successRate}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={template.successRate}
                            sx={{ width: 60, height: 6 }}
                            color={template.successRate > 95 ? 'success' : template.successRate > 90 ? 'warning' : 'error'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {template.lastUsed ? formatDate(template.lastUsed) : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analytics.recentActivity.map((activity, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {activity.templateName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(activity.date)}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${activity.emailsSent} sent`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};