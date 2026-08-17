/**
 * Logging middleware
 * Request/response logging for API routes
 */

const { logRequest, generateRequestId } = require('../../shared/utils/logging');

/**
 * Request logging middleware
 * This is a re-export of the shared logging utility
 */
const requestLogger = logRequest;

/**
 * Request ID middleware
 * Generates and attaches unique request ID
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function attachRequestId(req, res, next) {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  req.context = {
    ...req.context,
    requestId,
    startTime: new Date()
  };

  // Attach to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
}

/**
 * Response time middleware
 * Calculates and logs response time
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function responseTime(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });

  next();
}

/**
 * API version middleware
 * Attaches API version to response headers
 * @param {string} version - API version
 * @returns {Function} Express middleware
 */
function apiVersion(version) {
  return (req, res, next) => {
    res.setHeader('X-API-Version', version);
    next();
  };
}

/**
 * CORS middleware configuration
 * @param {Object} [options] - CORS options
 * @returns {Function} Express middleware
 */
function corsMiddleware(options = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders = ['X-Request-ID', 'X-Response-Time', 'X-API-Version'],
    credentials = true,
    maxAge = 86400
  } = options;

  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    res.setHeader('Access-Control-Allow-Credentials', credentials);
    res.setHeader('Access-Control-Max-Age', maxAge);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

/**
 * Rate limiting middleware
 * Simple in-memory rate limiter
 * @param {Object} [options] - Rate limit options
 * @returns {Function} Express middleware
 */
function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = 'Too many requests, please try again later'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request log for this IP
    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const requestLog = requests.get(key);

    // Remove old requests outside the window
    const recentRequests = requestLog.filter(time => time > windowStart);
    requests.set(key, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }

    // Add current request
    recentRequests.push(now);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - recentRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
}

module.exports = {
  requestLogger,
  attachRequestId,
  responseTime,
  apiVersion,
  corsMiddleware,
  rateLimit
};
