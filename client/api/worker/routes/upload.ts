import { Hono } from 'hono';
import { Env } from '../db';
import { authenticateToken, requirePermission, AuthVariables } from '../middleware';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

// File uploads require multer/filesystem - not available on Workers
// Return 501 with guidance to use R2 in the future

app.post('/image', requirePermission('settings:update'), async (c) => {
  return c.json({
    success: false,
    message: 'File uploads are not yet supported on this deployment. Use R2 storage integration for production file uploads.',
  }, 501);
});

app.delete('/image/:filename', requirePermission('settings:update'), async (c) => {
  return c.json({
    success: false,
    message: 'File deletion is not yet supported on this deployment.',
  }, 501);
});

export default app;
