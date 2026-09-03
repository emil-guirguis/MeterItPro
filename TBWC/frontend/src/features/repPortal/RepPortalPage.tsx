/**
 * Rep Portal — admin hub for everything reps see / request.
 *
 * Two tabs:
 *   - Documents      → manage the private rep-docs library (upload/tree/rename/delete)
 *   - Rep Inquiries  → approve/delete applicants who requested rep access
 *
 * Both talk to the shared Supabase project directly (Storage / PostgREST / edge
 * functions) with the admin's access token — see storageService / repLeadsService.
 */
import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import DocumentsTab from './DocumentsTab';
import RepInquiriesTab from './RepInquiriesTab';

export default function RepPortalPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Rep Portal
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Rep Inquiries" />
        <Tab label="Documents" />
      </Tabs>

      {tab === 0 ? <RepInquiriesTab /> : <DocumentsTab />}
    </Box>
  );
}
