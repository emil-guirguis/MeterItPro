import { Box, Container, Typography } from '@mui/material';
import { Route, Routes } from 'react-router-dom';

function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        TBWC Admin Portal
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Scaffold. Shares the MUI framework in <code>framework/frontend</code> with MeterItPro and
        MeterItProSync.
      </Typography>
    </Container>
  );
}

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Box>
  );
}
