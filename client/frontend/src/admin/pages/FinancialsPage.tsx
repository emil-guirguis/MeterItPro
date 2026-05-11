import React from 'react';
import { Box, Typography } from '@mui/material';

const FinancialsPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={1}>
        Financials
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Financial reporting and billing management — coming soon.
      </Typography>
    </Box>
  );
};

export default FinancialsPage;
