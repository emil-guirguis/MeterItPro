import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={1}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Clients</Typography>
              <Typography variant="h4" fontWeight="bold">—</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Active Tenants</Typography>
              <Typography variant="h4" fontWeight="bold">—</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Users</Typography>
              <Typography variant="h4" fontWeight="bold">—</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Revenue</Typography>
              <Typography variant="h4" fontWeight="bold">—</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboardPage;
