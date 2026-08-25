import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardActionArea, CardContent, Container, Divider,
  Grid, Stack, Typography,
} from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../../hooks/useAuth';

const SupportLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      {/* Hero */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8, px: 2, textAlign: 'center' }}>
        <SupportAgentIcon sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          MeterIt Pro Support
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, maxWidth: 600, mx: 'auto' }}>
          We're here to help. Submit a ticket, track your requests, or browse our documentation.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          {isAuthenticated ? (
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<ConfirmationNumberIcon />}
              onClick={() => navigate('/support/tickets')}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            >
              View My Tickets
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              startIcon={<ConfirmationNumberIcon />}
              onClick={() => navigate('/support/login')}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Sign In to Submit a Ticket
            </Button>
          )}
        </Stack>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Support options */}
        <Grid container spacing={4} mb={8}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <ConfirmationNumberIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>Submit a Ticket</Typography>
                <Typography variant="body2" color="text.secondary">
                  Log in and submit a support request. Our team will respond within 1 business day.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardActionArea
                onClick={() => navigate('/support/documentations')}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent>
                  <MenuBookIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Documentation</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Browse our guides and tutorials to get the most out of MeterIt Pro.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <EmailIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>Email Us</Typography>
                <Typography variant="body2" color="text.secondary">
                  Reach us directly at{' '}
                  <Box component="a" href="mailto:support@meteritpro.com" sx={{ color: 'primary.main' }}>
                    support@meteritpro.com
                  </Box>
                  {' '}for urgent issues.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 6 }} />

        {/* SLA info */}
        <Box sx={{ maxWidth: 700, mx: 'auto', textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>Support Hours & SLA</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Our support team is available Monday–Friday, 8 AM–6 PM EST.
          </Typography>
          <Grid container spacing={3} mt={1}>
            {[
              { label: 'Urgent', time: '2 hours', color: 'error.main' },
              { label: 'High',   time: '4 hours', color: 'warning.main' },
              { label: 'Medium', time: '1 business day', color: 'info.main' },
              { label: 'Low',    time: '3 business days', color: 'success.main' },
            ].map(({ label, time, color }) => (
              <Grid item xs={6} sm={3} key={label}>
                <Box sx={{ bgcolor: 'grey.100', borderRadius: 2, p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{time}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.200', py: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} MeterIt Pro · support@meteritpro.com
        </Typography>
      </Box>
    </Box>
  );
};

export default SupportLandingPage;
