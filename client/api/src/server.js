// @ts-nocheck
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import PostgreSQL database connection
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const authEnhancedRoutes = require('./routes/auth-enhanced');
const userRoutes = require('./routes/users');
const locationRoutes = require('./routes/location');
const contactRoutes = require('./routes/contacts');
const meterRoutes = require('./routes/meters');
const meterReadingRoutes = require('./routes/meterReadings');
const templateRoutes = require('./routes/templates');
const emailRoutes = require('./routes/emails');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const syncRoutes = require('./routes/sync');
const schemaRoutes = require('./routes/schema');
const devicesRoutes = require('./routes/device');
const deviceRegisterRoutes = require('./routes/deviceRegister');
const registersRoutes = require('./routes/registers');
const meterElementRoutes = require('./routes/meterElement');
const dashboardRoutes = require('./routes/dashboard');
const favoritesRoutes = require('./routes/favorites');
const aiSearchRoutes = require('./routes/aiSearch');
const reportsRoutes = require('./routes/reports');
const emailLogsRoutes = require('./routes/email-logs');
// Import tenant isolation middleware
const { setTenantContext } = require('./middleware/tenantContext');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection will be handled by the database module

// Security middleware
app.use(helmet());

// CORS configuration - MUST come before rate limiting
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

// Apply CORS globally FIRST
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Rate limiting - DISABLED FOR NOW to debug CORS issues
// TODO: Re-enable after CORS is working
// const limiter = rateLimit({...});
// app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to PostgreSQL and initialize services
(async () => {
  try {
    console.log('🔄 [INIT] Starting database connection...');
    // Connect to PostgreSQL
    await db.connect();
    console.log('✅ [INIT] Database connected');

    console.log('🔄 [INIT] Skipping database migrations (migrations folder removed)...');

    console.log('🔄 [INIT] Initializing email templates...');
    // Initialize email templates (seed default templates if needed)
    await initializeEmailTemplates();
    console.log('✅ [INIT] Email templates initialized');

    console.log('🔄 [INIT] Initializing email service...');
    // Initialize email service
    await initializeEmailService();
    console.log('✅ [INIT] Email service initialized');

    console.log('🔄 [INIT] Initializing notification scheduler...');
    // Initialize notification scheduler
    await initializeNotificationScheduler();
    console.log('✅ [INIT] Notification scheduler initialized');

    console.log('✅ [INIT] All services initialized successfully');
    console.log('✅ [INIT] Initialization complete - server should now be running');
  } catch (error) {
    console.error('❌ [INIT] Initialization error:', error.message);
    console.error('❌ [INIT] Stack trace:', error.stack);
    console.error('❌ [INIT] Exiting process with code 1');
    process.exit(1);
  }
})();

console.log('✅ [INIT] Initialization IIFE started (async)');
console.log('✅ [INIT] Main thread continuing - server will start listening...');

// Prevent the process from exiting if there are no active handles
// This is important because the initialization might complete before the server starts listening
console.log('🔄 [PROCESS] Setting up process keep-alive...');
const keepAliveInterval = setInterval(() => {
  // This interval keeps the process alive
  // It will be cleared when the server is properly listening
}, 30000);
console.log('✅ [PROCESS] Keep-alive interval set');

/**
 * Initialize email templates system
 */
async function initializeEmailTemplates() {
  try {
    console.log('🔄 [EMAIL_TEMPLATES] Starting initialization...');
    // Import EmailTemplateSeeder
    const EmailTemplateSeeder = require('./services/EmailTemplateSeeder');
    console.log('🔄 [EMAIL_TEMPLATES] EmailTemplateSeeder imported');
    
    // Seed default templates if needed
    await EmailTemplateSeeder.seedOnStartup();
    console.log('✅ [EMAIL_TEMPLATES] Seeding completed');
  } catch (error) {
    console.error('❌ [EMAIL_TEMPLATES] Failed to initialize:', error.message);
    console.error('❌ [EMAIL_TEMPLATES] Stack:', error.stack);
    // Don't exit the process - the server can still run without templates
  }
}

/**
 * Initialize email service
 */
async function initializeEmailService() {
  try {
    console.log('🔄 [EMAIL_SERVICE] Starting initialization...');
    // Import EmailService
    const emailService = require('./services/EmailService');
    console.log('🔄 [EMAIL_SERVICE] EmailService imported');
    
    // Initialize with default configuration
    const result = await emailService.initialize();
    console.log('🔄 [EMAIL_SERVICE] Initialize result:', result);
    
    if (result.success) {
      console.log('� [EMAiIL_SERVICE] Initialized successfully');
    } else {
      console.log('⚠️ [EMAIL_SERVICE] Initialization failed:', result.error);
      console.log('💡 [EMAIL_SERVICE] Configure SMTP settings in .env file to enable email functionality');
    }
  } catch (error) {
    console.error('❌ [EMAIL_SERVICE] Failed to initialize:', error.message);
    console.error('❌ [EMAIL_SERVICE] Stack:', error.stack);
    // Don't exit the process - the server can still run without email
  }
}

/**
 * Initialize notification scheduler
 */
async function initializeNotificationScheduler() {
  try {
    console.log('🔄 [NOTIFICATION_SCHEDULER] Starting initialization...');
    // Import NotificationScheduler
    const notificationScheduler = require('./services/NotificationScheduler');
    console.log('🔄 [NOTIFICATION_SCHEDULER] NotificationScheduler imported');
    
    // Initialize with default configuration
    const result = await notificationScheduler.initialize();
    console.log('� [NOTIiFICATION_SCHEDULER] Initialize result:', result);
    
    if (result.success) {
      console.log('📅 [NOTIFICATION_SCHEDULER] Initialized successfully');
    } else {
      console.log('⚠️ [NOTIFICATION_SCHEDULER] Initialization failed:', result.error);
    }
  } catch (error) {
    console.error('❌ [NOTIFICATION_SCHEDULER] Failed to initialize:', error.message);
    console.error('❌ [NOTIFICATION_SCHEDULER] Stack:', error.stack);
    // Don't exit the process - the server can still run without scheduler
  }
}


// Import auth middleware for global application
const { authenticateToken } = require('./middleware/auth');

// Routes
app.use('/api/auth', authEnhancedRoutes);
// app.use('/api/auth', authRoutes); // Using auth-enhanced instead

// Apply authentication middleware globally to all protected routes
// This must run BEFORE tenant context middleware
app.use('/api/users', authenticateToken, setTenantContext, userRoutes);
app.use('/api/location', authenticateToken, setTenantContext, locationRoutes);
app.use('/api/contacts', authenticateToken, setTenantContext, contactRoutes);
app.use('/api/meters', authenticateToken, setTenantContext, meterRoutes);
app.use('/api/meterreadings', authenticateToken, setTenantContext, meterReadingRoutes);
app.use('/api/templates', authenticateToken, setTenantContext, templateRoutes);
app.use('/api/emails', authenticateToken, setTenantContext, emailRoutes);
app.use('/api/settings', authenticateToken, setTenantContext, settingsRoutes);
app.use('/api/upload', authenticateToken, setTenantContext, uploadRoutes);
// Sync routes use API key authentication (not JWT), so no authenticateToken middleware
app.use('/api/sync', syncRoutes);
app.use('/api/schema', authenticateToken, setTenantContext, schemaRoutes);
app.use('/api/device', authenticateToken, setTenantContext, devicesRoutes);
app.use('/api/devices/:deviceId/registers', authenticateToken, setTenantContext, deviceRegisterRoutes);
app.use('/api/registers', authenticateToken, setTenantContext, registersRoutes);
app.use('/api/meters/:meterId/elements', authenticateToken, setTenantContext, meterElementRoutes);
app.use('/api/dashboard', authenticateToken, setTenantContext, dashboardRoutes);
app.use('/api/favorites', authenticateToken, setTenantContext, favoritesRoutes);
app.use('/api/ai/search', authenticateToken, setTenantContext, aiSearchRoutes);
app.use('/api/reports', authenticateToken, setTenantContext, reportsRoutes);
app.use('/api/email-logs', authenticateToken, setTenantContext, emailLogsRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Get PostgreSQL health status
    const dbHealth = await db.healthCheck();
    
    // Get email templates health status
    let templatesHealth = null;
    try {
      const EmailTemplateSeeder = require('./services/EmailTemplateSeeder');
      templatesHealth = await EmailTemplateSeeder.checkTemplateHealth();
    } catch (error) {
      templatesHealth = { isHealthy: false, error: error.message };
    }

    // Get email service health status
    let emailHealth = null;
    try {
      const emailService = require('./services/EmailService');
      emailHealth = await emailService.getHealthStatus();
    } catch (error) {
      emailHealth = { isHealthy: false, error: error.message };
    }

    // Get notification scheduler health status
    let schedulerHealth = null;
    try {
      const notificationScheduler = require('./services/NotificationScheduler');
      schedulerHealth = await notificationScheduler.getHealthStatus();
    } catch (error) {
      schedulerHealth = { isHealthy: false, error: error.message };
    }

    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth.status === 'healthy' ? 'Connected' : 'Disconnected',
      databaseDetails: dbHealth,
      templates: templatesHealth,
      email: emailHealth,
      scheduler: schedulerHealth,
    };

    // Determine overall status
    const isHealthy = healthData.database === 'Connected' &&
                     (templatesHealth && templatesHealth.isHealthy) &&
                     (emailHealth && emailHealth.isHealthy) &&
                     (schedulerHealth && schedulerHealth.isHealthy);

    healthData.status = isHealthy ? 'OK' : 'Degraded';

    res.json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Test endpoint to check database contents
// TEMPORARILY DISABLED - methods may not be implemented
/*
app.get('/api/test/db-status', async (req, res) => {
  try {
    const User = require('./models/User');
    
    // Get database status and stats
    const dbStatus = await db.getStatus();
    const userStats = await User.getStats();
    const sampleUsers = await User.findAll({ limit: 1 });
    
    // Get some sample data from meter readings table
    const meterReadingCount = await db.query('SELECT COUNT(*) as count FROM meter_reading');
    
    res.json({
      success: true,
      database: process.env.POSTGRES_DB,
      connectionPool: dbStatus,
      tables: {
        users: userStats.total_users,
        meterReadings: meterReadingCount.rows[0].count
      },
      samples: {
        user: sampleUsers[0] || null,
        meterReading: sampleReading.rows[0] || null
      },
      userStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
*/

// Test endpoint to create a test user
// TEMPORARILY DISABLED - methods may not be implemented
/*
app.post('/api/test/create-user', async (req, res) => {
  try {
    const User = require('./models/User'); // Using standard PostgreSQL model
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'admin@example.com' });
    if (existingUser) {
      return res.json({
        success: true,
        message: 'User already exists',
        user: { email: existingUser.email, name: existingUser.name, role: existingUser.role }
      });
    }
    
    // Create test user
    const user = new User({
      email: 'admin@example.com',
      name: 'Test Administrator',
      password: 'admin123', // Will be hashed by the model
      role: 'admin',
      permissions: [
        'user:create', 'user:read', 'user:update', 'user:delete',
        'location:create', 'location:read', 'location:update', 'location:delete',
        'contact:create', 'contact:read', 'contact:update', 'contact:delete',
        'meter:create', 'meter:read', 'meter:update', 'meter:delete',
        'settings:read', 'settings:update',
        'template:create', 'template:read', 'template:update', 'template:delete'
      ],
      status: 'active'
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Test user created successfully',
      user: { email: user.email, name: user.name, role: user.role },
      credentials: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
*/

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  // Handle tenant context errors
  if (error.message && error.message.includes('Tenant context')) {
    return res.status(401).json({
      success: false,
      message: 'Tenant context error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle PostgreSQL-specific errors
  if (error.code === '23505') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      error: 'A record with this value already exists'
    });
  }
  
  if (error.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint violation',
      error: 'Referenced record does not exist'
    });
  }
  
  if (error.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Invalid input format',
      error: 'Invalid data type or format'
    });
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close PostgreSQL database connections
    console.log('📊 Closing database connections...');
    await db.disconnect();
    console.log('✅ Database connections closed');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Setup graceful shutdown handlers
// TEMPORARILY DISABLED for debugging
/*
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
*/

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ [PROCESS] Uncaught Exception:', error.message);
  console.error('❌ [PROCESS] Stack:', error.stack);
  // gracefulShutdown('uncaughtException'); // TEMPORARILY DISABLED
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [PROCESS] Unhandled Rejection at:', promise);
  console.error('❌ [PROCESS] Reason:', reason);
  if (reason instanceof Error) {
    console.error('❌ [PROCESS] Stack:', reason.stack);
  }
  // gracefulShutdown('unhandledRejection'); // TEMPORARILY DISABLED
});

// Monitor process exit
const originalExit = process.exit;
process.exit = function(code) {
  console.error(`❌ [PROCESS] process.exit(${code}) called`);
  console.error('❌ [PROCESS] Stack trace:');
  console.error(new Error().stack);
  return originalExit.call(process, code);
};

// Start server
console.log('🔄 [SERVER] About to call app.listen()...');
console.log(`� [SERVEeR] PORT = ${PORT}`);

const server = app.listen(PORT, () => {
  console.log(`🚀 [SERVER] Server running on port ${PORT}`);
  console.log(`📊 [SERVER] Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 [SERVER] Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log('✅ [SERVER] Server initialization complete - ready to accept requests');
  
  // Keep the process alive
  console.log('📌 [PROCESS] Server is now running and keeping process alive');
  
  // Set a timeout to verify the server is still running after 5 seconds
  setTimeout(() => {
    console.log('✅ [PROCESS] Server is still running after 5 seconds - all good!');
  }, 5000);
});

console.log('✅ [SERVER] app.listen() called successfully');

// Handle server shutdown
server.on('close', () => {
  console.log('🚀 [SERVER] HTTP server closed');
});

// Log when server is listening
server.on('listening', () => {
  console.log('📡 [SERVER] Server is listening for connections');
  console.log('✅ [PROCESS] Server is listening - clearing keep-alive interval');
  clearInterval(keepAliveInterval);
  console.log('✅ [PROCESS] Keep-alive interval cleared - server will stay alive via active connections');
});

// Log any server errors
server.on('error', (error) => {
  console.error('❌ [SERVER] Server error:', error);
});