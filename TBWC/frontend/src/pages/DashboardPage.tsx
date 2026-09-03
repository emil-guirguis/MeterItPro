import { Box, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import RepInquiriesCard from '../features/repPortal/RepInquiriesCard';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const firstName = user?.first_name?.trim() || 'there';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Welcome, {firstName}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {isAdmin ? 'Admin overview' : 'Your portal overview'}
      </Typography>

      {isAdmin && <RepInquiriesCard />}
    </Box>
  );
}
