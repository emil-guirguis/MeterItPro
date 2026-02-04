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
// const directMeterRoutes = require('./routes/directMeter'); // Temporarily disabled
const devicesRoutes = require('./routes/device');
const deviceRegisterRoutes = require('./routes/deviceRegister');
const registersRoutes = require('./routes/registers');
const autoCollectionRoutes = require('./routes/autoCollection');
const meterElementRoutes = require('./routes/meterElement');
const dashboardRoutes = require('./routes/dashboard');
const favoritesRoutes = require('./routes/favorites');
const aiSearchRoutes = require('./routes/aiSearch');
const reportsRoutes = require('./routes/reports');
const emailLogsRoutes = require('./routes/email-logs');
// const { router: threadingRoutes, initializeThreadingService } = require('./routes/threading');

// Import tenant isolation middleware
const { setTenantContext } = require('./middleware/tenantContext');

const app = express();
const PORT = process.env.PORT || 3001;

// Threading service (will be initialized after PostgreSQL connection)
let threadingService = null;

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

    console.log('🔄 [INIT] Initializing notification agent...');
    // Initialize notification agent
    await initializeNotificationAgent();
    console.log('✅ [INIT] Notification agent initialized');

    // console.log('🔄 [INIT] Initializing meter data analyzer...');
    // // Initialize meter data analyzer
    // await initializeMeterDataAnalyzer();
    // console.log('✅ [INIT] Meter data analyzer initialized');

    console.log('🔄 [INIT] Initializing meter integration service...');
    // Initialize meter integration service
    await initializeMeterIntegrationService();
    console.log('✅ [INIT] Meter integration service initialized');

    console.log('🔄 [INIT] Initializing meter monitoring service...');
    // Initialize meter monitoring service
    await initializeMeterMonitoringService();
    console.log('✅ [INIT] Meter monitoring service initialized');

    console.log('🔄 [INIT] Initializing threading system...');
    // Initialize threading service first (required for auto collection)
    await initializeThreadingSystem();
    console.log('✅ [INIT] Threading system initialization completed');

    console.log('✅ [INIT] All services initialized successfully');
    console.log('✅ [INIT] Initialization async function completing...');

    // Initialize auto meter collection service (requires threading service)
    // TEMPORARILY DISABLED - service methods are commented out
    // await initializeAutoMeterCollection();
    
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

/**
 * Initialize notification agent
 * Monitors meter health and creates notifications
 */
async function initializeNotificationAgent() {
  try {
    console.log('🔔 [NOTIFICATION_AGENT] Starting initialization...');
    // Import NotificationAgent
    const notificationAgent = require('./services/NotificationAgent');

    console.log('🔔 [NOTIFICATION_AGENT] NotificationAgent imported');
    
    // Initialize with default configuration
    await notificationAgent.initialize();
    console.log('🔔 [NOTIFICATION_AGENT] Initialize result: success');
    
    console.log('✅ [NOTIFICATION_AGENT] Initialized successfully');
  } catch (error) {
    console.error('❌ [NOTIFICATION_AGENT] Failed to initialize:', error.message);
    console.error('❌ [NOTIFICATION_AGENT] Stack:', error.stack);
    // Don't exit the process - the server can still run without agent
  }
}

// /**
//  * Initialize meter data analyzer
//  */
// async function initializeMeterDataAnalyzer() {
//   try {
//     console.log('🔄 [METER_ANALYZER] Starting initialization...');
//     // Import MeterDataAnalyzer
//     const meterDataAnalyzer = require('./services/MeterDataAnalyzer');
//     console.log('🔄 [METER_ANALYZER] MeterDataAnalyzer imported');
    
//     // Initialize with default configuration
//     const result = await meterDataAnalyzer.initialize();
//     console.log('� [ METER_ANALYZER] Initialize result:', result);
    
//     if (result.success) {
//       console.log('📊 [METER_ANALYZER] Initialized successfully');
      
//       // Start monitoring if enabled
//       console.log('🔄 [METER_ANALYZER] Starting monitoring...');
//       meterDataAnalyzer.startMonitoring();
//       console.log('✅ [METER_ANALYZER] Monitoring started');
//     } else {
//       console.log('⚠️ [METER_ANALYZER] Initialization failed:', result.error);
//     }
//   } catch (error) {
//     console.error('❌ [METER_ANALYZER] Failed to initialize:', error.message);
//     console.error('❌ [METER_ANALYZER] Stack:', error.stack);
//     // Don't exit the process - the server can still run without analyzer
//   }
// }

/**
 * Initialize meter integration service
 */
async function initializeMeterIntegrationService() {
  try {
    console.log('🔄 [METER_INTEGRATION] Starting initialization...');
    // Import MeterIntegrationService
    const meterIntegrationService = require('./services/MeterIntegrationService');
    console.log('🔄 [METER_INTEGRATION] MeterIntegrationService imported');
    
    // Initialize with default configuration
    const result = await meterIntegrationService.initialize();
    console.log('� [METEeR_INTEGRATION] Initialize result:', result);
    
    if (result.success) {
      console.log('📡 [METER_INTEGRATION] Initialized successfully');
    } else {
      console.log('⚠️ [METER_INTEGRATION] Initialization failed:', result.error);
    }
  } catch (error) {
    console.error('❌ [METER_INTEGRATION] Failed to initialize:', error.message);
    console.error('❌ [METER_INTEGRATION] Stack:', error.stack);
    // Don't exit the process - the server can still run without integration
  }
}

/**
 * Initialize meter monitoring service
 */
async function initializeMeterMonitoringService() {
  try {
    console.log('🔄 [METER_MONITORING] Starting initialization...');
    // Import MeterMonitoringService
    const meterMonitoringService = require('./services/MeterMonitoringService');
    console.log('� [MEeTER_MONITORING] MeterMonitoringService imported');
    
    // Initialize with default configuration
    const result = await meterMonitoringService.initialize();
    console.log('🔄 [METER_MONITORING] Initialize result:', result);
    
    if (result.success) {
      console.log('📊 [METER_MONITORING] Initialized successfully');
      
      // Start monitoring if enabled
      console.log('🔄 [METER_MONITORING] Starting monitoring...');
      meterMonitoringService.startMonitoring();
      console.log('✅ [METER_MONITORING] Monitoring started');
    } else {
      console.log('⚠️ [METER_MONITORING] Initialization failed:', result.error);
    }
  } catch (error) {
    console.error('❌ [METER_MONITORING] Failed to initialize:', error.message);
    console.error('❌ [METER_MONITORING] Stack:', error.stack);
    // Don't exit the process - the server can still run without monitoring
  }
}

/**
 * Initialize auto meter collection service (threaded mode only)
 */
async function initializeAutoMeterCollection() {
  try {
    // Import AutoMeterCollectionService
    const autoMeterCollectionService = require('./services/AutoMeterCollectionService');
    
    // Simple configuration - threaded mode only, 30-second interval
    const config = {
      collection: {
        enabled: true,
        interval: 30000, // Fixed 30 seconds
        batchSize: 10,
        timeout: 10000,
        retryAttempts: 2
      },
      meters: {
        defaultIP: process.env.DEFAULT_METER_IP,
        defaultPort: parseInt(process.env.DEFAULT_METER_PORT) || 502,
        registers: {
          voltage: { address: 5, count: 1, scale: 200, unit: 'V' },
          current: { address: 6, count: 1, scale: 100, unit: 'A' },
          power: { address: 7, count: 1, scale: 1, unit: 'W' },
          energy: { address: 8, count: 1, scale: 1, unit: 'Wh' },
          frequency: { address: 0, count: 1, scale: 10, unit: 'Hz' },
          powerFactor: { address: 9, count: 1, scale: 1000, unit: 'pf' }
        }
      },
      database: {
        batchInsert: false, // Use individual inserts for better error handling
        maxBatchSize: 100
      },
      logging: {
        logSuccessfulReads: true, // Show detailed collection logs
        logFailedReads: true,
        logInterval: 300000 // Log stats every 5 minutes
      }
    };
    
    // Initialize with threading service (required)
    const result = await autoMeterCollectionService.initialize(config, threadingService);
    
    if (result.success) {
      console.log('🔄 Auto meter collection service initialized (threaded mode)');
      
      // Auto-start collection immediately
      const startResult = autoMeterCollectionService.startCollection();
      
      if (startResult.success) {
        console.log('🔄 Auto meter collection started (30-second interval)');
      } else {
        console.log('⚠️ Failed to start auto meter collection:', startResult.message);
      }
    } else {
      console.log('⚠️ Auto meter collection service initialization failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to initialize auto meter collection service:', error.message);
    // Don't exit the process - the server can still run without auto collection
  }
}

/**
 * Initialize the threading system
 */
async function initializeThreadingSystem() {
  try {
    console.log('🧵 [THREADING] Initializing MCP threading system...');
    
    console.log('🧵 [THREADING] Importing ThreadingService...');
    // Import ThreadingService
    const { ThreadingService } = require('./services/threading/ThreadingService.js');
    console.log('🧵 [THREADING] ThreadingService imported successfully');
    
    console.log('🧵 [THREADING] Creating threading configuration...');
    // Create threading service with default configuration
    const threadingConfig = {
      worker: {
        maxMemoryMB: parseInt(process.env.WORKER_MAX_MEMORY_MB) || 512,
        logLevel: process.env.WORKER_LOG_LEVEL || 'info',
        moduleConfig: {
          database: {
            poolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
            timeout: parseInt(process.env.DB_TIMEOUT) || 10000,
            retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS) || 3,
            batchSize: parseInt(process.env.DB_BATCH_SIZE) || 100,
            flushInterval: parseInt(process.env.DB_FLUSH_INTERVAL) || 5000
          }
        }
      }
    };
    console.log('🧵 [THREADING] Configuration created');
    
    console.log('🧵 [THREADING] Instantiating ThreadingService...');
    threadingService = new ThreadingService(threadingConfig);
    console.log('🧵 [THREADING] ThreadingService instantiated');
    
    // Initialize the threading routes with the service
    // initializeThreadingService(threadingService); // Function not available yet
    
    console.log('🧵 [THREADING] Setting up event handlers...');
    // Setup threading service event handlers
    setupThreadingEventHandlers();
    console.log('🧵 [THREADING] Event handlers set up');
    
    // Start the threading service if auto-start is enabled
    if (process.env.THREADING_AUTO_START !== 'false') {
      console.log('🧵 [THREADING] Starting threading service...');
      const result = await threadingService.start();
      console.log('🧵 [THREADING] Threading service start result:', result);
      if (result.success) {
        console.log(`✅ [THREADING] MCP threading system started -> Thread ID: ${result.threadId}`);
      } else {
        console.warn(`⚠️ [THREADING] MCP threading system failed to start: ${result.error}`);
      }
    } else {
      console.log('🧵 [THREADING] MCP threading system initialized (auto-start disabled)');
    }
    console.log('🧵 [THREADING] Threading system initialization complete');
  } catch (error) {
    console.error('❌ [THREADING] Failed to initialize threading system:', error.message);
    console.error('❌ [THREADING] Stack trace:', error.stack);
    // Don't exit the process - the server can still run without threading
  }
}

/**
 * Setup event handlers for the threading service
 */
function setupThreadingEventHandlers() {
  if (!threadingService) return;
  
  threadingService.on('workerStarted', (data) => {
    console.log(`🧵 Worker thread started: ${data.threadId}`);
  });
  
  threadingService.on('workerStopped', () => {
    console.log('🧵 Worker thread stopped');
  });
  
  threadingService.on('workerError', (data) => {
    console.error('🧵 Worker thread error:', data.error.message);
  });
  
  threadingService.on('workerUnhealthy', (data) => {
    console.warn('🧵 Worker thread unhealthy:', data.reason);
  });
  
  threadingService.on('restartSuccess', (data) => {
    console.log(`🧵 Worker thread restarted successfully (attempt ${data.attemptNumber})`);
  });
  
  threadingService.on('restartFailed', (data) => {
    console.error(`🧵 Worker thread restart failed (attempt ${data.attemptNumber}): ${data.error}`);
  });
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
// app.use('/api', authenticateToken, setTenantContext, directMeterRoutes); // Temporarily disabled
app.use('/api/device', authenticateToken, setTenantContext, devicesRoutes);
app.use('/api/devices/:deviceId/registers', authenticateToken, setTenantContext, deviceRegisterRoutes);
app.use('/api/registers', authenticateToken, setTenantContext, registersRoutes);
app.use('/api/auto-collection', authenticateToken, setTenantContext, autoCollectionRoutes);
app.use('/api/meters/:meterId/elements', authenticateToken, setTenantContext, meterElementRoutes);
app.use('/api/dashboard', authenticateToken, setTenantContext, dashboardRoutes);
app.use('/api/favorites', authenticateToken, setTenantContext, favoritesRoutes);
app.use('/api/ai/search', authenticateToken, setTenantContext, aiSearchRoutes);
app.use('/api/reports', authenticateToken, setTenantContext, reportsRoutes);
app.use('/api/email-logs', authenticateToken, setTenantContext, emailLogsRoutes);
// app.use('/api/threading', authenticateToken, setTenantContext, threadingRoutes); // TEMPORARILY DISABLED

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

    // Get meter data analyzer health status
    let analyzerHealth = null;
    try {
      const meterDataAnalyzer = require('./services/MeterDataAnalyzer');
      analyzerHealth = await meterDataAnalyzer.getHealthStatus();
    } catch (error) {
      analyzerHealth = { isHealthy: false, error: error.message };
    }

    // Get auto meter collection health status
    let autoCollectionHealth = null;
    try {
      const autoMeterCollectionService = require('./services/AutoMeterCollectionService');
      autoCollectionHealth = await autoMeterCollectionService.getHealthStatus();
    } catch (error) {
      autoCollectionHealth = { isHealthy: false, error: error.message };
    }
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth.status === 'healthy' ? 'Connected' : 'Disconnected',
      databaseDetails: dbHealth,
      templates: templatesHealth,
      email: emailHealth,
      scheduler: schedulerHealth,
      analyzer: analyzerHealth,
      autoCollection: autoCollectionHealth,
      threading: null
    };

    // Add threading system health if available
    if (threadingService) {
      try {
        const threadingHealth = await threadingService.getHealthStatus();
        healthData.threading = {
          status: threadingHealth.isHealthy ? 'Healthy' : 'Unhealthy',
          worker: {
            running: threadingHealth.worker.isRunning,
            threadId: threadingHealth.worker.threadId
          },
          lastHealthCheck: threadingHealth.lastCheck,
          uptime: threadingHealth.uptime,
          memoryUsage: threadingHealth.memory
        };
      } catch (error) {
        healthData.threading = {
          status: 'Error',
          error: error.message
        };
      }
    } else {
      healthData.threading = {
        status: 'Not Initialized'
      };
    }

    // Determine overall status
    const isHealthy = healthData.database === 'Connected' && 
                     (!threadingService || healthData.threading.status === 'Healthy') &&
                     (templatesHealth && templatesHealth.isHealthy) &&
                     (emailHealth && emailHealth.isHealthy) &&
                     (schedulerHealth && schedulerHealth.isHealthy) &&
                     (analyzerHealth && analyzerHealth.isHealthy) &&
                     (autoCollectionHealth && autoCollectionHealth.isHealthy);
    
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
    // Stop threading service first
    if (threadingService) {
      console.log('🧵 Stopping threading service...');
      await threadingService.stop(true);
      console.log('✅ Threading service stopped');
    }
    
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
  console.log(`🧵 [SERVER] Threading auto-start: ${process.env.THREADING_AUTO_START !== 'false' ? 'enabled' : 'disabled'}`);
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