# Backend API Framework Guide

## Overview

The Backend API Framework provides a standardized, scalable approach to building RESTful APIs with Express.js. It includes base classes, middleware, utilities, and patterns that reduce boilerplate code and ensure consistency across your API endpoints.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Base Classes](#base-classes)
4. [Middleware](#middleware)
5. [Utilities](#utilities)
6. [Examples](#examples)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)

---

## Quick Start

### Basic CRUD API in 5 Steps

```javascript
const { BaseRouter, BaseController, BaseService } = require('../../framework/backend/api/base');
const { requireAuth, validateBody } = require('../../framework/backend/api/middleware');
const Product = require('./models/Product');

// 1. Create Service
const productService = new BaseService({
  model: Product,
  searchFields: ['name', 'description']
});

// 2. Create Controller
const productController = new BaseController({
  service: productService,
  searchFields: ['name', 'description']
});

// 3. Create Router
const productRouter = new BaseRouter({
  basePath: '/api/products',
  requireAuth: true
});

// 4. Register CRUD routes
productRouter.registerCrudRoutes(productController);

// 5. Use in Express app
app.use('/api/products', productRouter.getRouter());
```

That's it! You now have a fully functional CRUD API with:
- List with pagination, search, and filtering
- Get by ID
- Create
- Update
- Delete
- Standardized error handling
- Authentication

---

## Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│         Express Routes              │
│    (HTTP Request/Response)          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         BaseRouter                  │
│  (Route registration & middleware)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       BaseController                │
│  (Request handling & validation)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        BaseService                  │
│   (Business logic & data access)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Sequelize Models               │
│        (Database)                   │
└─────────────────────────────────────┘
```

### Separation of Concerns

- **Router**: Route registration, middleware application, URL structure
- **Controller**: HTTP request/response handling, validation, response formatting
- **Service**: Business logic, database operations, data transformation
- **Model**: Data structure, relationships, database schema

---

## Base Classes

### BaseService

Handles business logic and database operations.

#### Constructor Options

```javascript
new BaseService({
  model,              // Required: Sequelize model
  logger,             // Optional: Custom logger
  searchFields,       // Optional: Fields to search in
  defaultIncludes,    // Optional: Default associations to include
  defaultOrder        // Optional: Default sort order
})
```

#### Built-in Methods

```javascript
// CRUD Operations
await service.findAll(options)      // List with pagination
await service.findById(id)          // Get by ID
await service.findOne(where)        // Find single item
await service.create(data)          // Create new item
await service.update(id, data)      // Update item
await service.delete(id)            // Delete item

// Bulk Operations
await service.bulkCreate(items)     // Create multiple items
await service.bulkUpdate(options)   // Update multiple items
await service.bulkDelete(options)   // Delete multiple items

// Utility Methods
await service.count(where)          // Count items
await service.exists(where)         // Check if exists
```

#### Custom Service Example

```javascript
class ProductService extends BaseService {
  constructor(model) {
    super({
      model,
      searchFields: ['name', 'description'],
      defaultOrder: [['name', 'ASC']]
    });
  }

  // Add custom business logic
  async findByCategory(category, options = {}) {
    return this.findAll({
      ...options,
      filters: { category }
    });
  }

  async updateStock(id, quantity) {
    const result = await this.findById(id);
    if (!result.success) return result;

    const product = result.data;
    const newStock = product.stock + quantity;

    if (newStock < 0) {
      return { success: false, error: 'Insufficient stock' };
    }

    return this.update(id, { stock: newStock });
  }
}
```

### BaseController

Handles HTTP requests and responses.

#### Constructor Options

```javascript
new BaseController({
  service,            // Required: Service instance
  logger,             // Optional: Custom logger
  validation,         // Optional: Validation schemas
  searchFields        // Optional: Fields to search in
})
```

#### Built-in Methods

```javascript
// CRUD Handlers
await controller.list(req, res)         // GET /
await controller.get(req, res)          // GET /:id
await controller.create(req, res)       // POST /
await controller.update(req, res)       // PUT /:id
await controller.delete(req, res)       // DELETE /:id

// Bulk Handlers
await controller.bulkCreate(req, res)   // POST /bulk
await controller.bulkUpdate(req, res)   // PUT /bulk
await controller.bulkDelete(req, res)   // DELETE /bulk

// Response Helpers
controller.sendSuccess(res, data, options)
controller.sendPaginated(res, data, pagination)
controller.sendError(res, error, statusCode, details)
```

#### Custom Controller Example

```javascript
class ProductController extends BaseController {
  constructor(service) {
    super({
      service,
      searchFields: ['name', 'description']
    });

    this.getByCategory = this.getByCategory.bind(this);
  }

  async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const options = this.extractListOptions(req);
      
      const result = await this.service.findByCategory(category, options);

      if (!result.success) {
        return this.sendError(res, result.error, 500);
      }

      this.sendPaginated(res, result.data, result.pagination);
    } catch (error) {
      this.sendError(res, error.message, 500);
    }
  }
}
```

### BaseRouter

Handles route registration and middleware.

#### Constructor Options

```javascript
new BaseRouter({
  basePath,           // Optional: Base path for routes
  requireAuth,        // Optional: Require auth by default (default: true)
  middleware,         // Optional: Global middleware array
  validation,         // Optional: Default validation schemas
  permissions         // Optional: Default permissions
})
```

#### Built-in Methods

```javascript
// CRUD Route Registration
router.registerCrudRoutes(controller, options)
router.registerBulkRoutes(controller)

// Individual Route Registration
router.get(path, handler, middleware)
router.post(path, handler, middleware)
router.put(path, handler, middleware)
router.delete(path, handler, middleware)
router.patch(path, handler, middleware)

// Advanced Registration
router.registerRoute(definition)
router.registerRoutes(definitions)

// Get Express Router
router.getRouter()
```

#### Custom Router Example

```javascript
class ProductRouter extends BaseRouter {
  constructor(controller) {
    super({
      basePath: '/api/products',
      requireAuth: true
    });

    this.controller = controller;
    this.setupRoutes();
  }

  setupRoutes() {
    // Register standard CRUD routes
    this.registerCrudRoutes(this.controller, {
      validation: {
        create: validateBody(productSchemas.create),
        update: validateBody(productSchemas.update)
      }
    });

    // Register custom routes
    this.get('/category/:category', this.controller.getByCategory);
    this.post('/:id/stock', this.controller.updateStock);

    // Register bulk operations
    this.registerBulkRoutes(this.controller);
  }
}
```

---

## Middleware

### Authentication

```javascript
const { requireAuth, optionalAuth, requirePermissions, requireRoles } = require('../middleware');

// Require authentication
router.get('/protected', requireAuth, handler);

// Optional authentication (attach user if present)
router.get('/public', optionalAuth, handler);

// Require specific permissions
router.post('/admin', requireAuth, requirePermissions(['write:admin']), handler);

// Require specific roles
router.delete('/users/:id', requireAuth, requireRoles(['admin']), handler);
```

### Validation

```javascript
const { validateBody, validateQuery, validateParams } = require('../middleware');
const Joi = require('joi');

const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required()
});

router.post('/users', validateBody(schema), handler);
router.get('/users', validateQuery(paginationSchema), handler);
router.get('/users/:id', validateParams(idSchema), handler);
```

### Error Handling

```javascript
const { errorHandler, notFoundHandler, asyncHandler } = require('../middleware');

// Wrap async handlers
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.json(users);
}));

// Apply error handlers (at the end of your app)
app.use(notFoundHandler);
app.use(errorHandler);
```

### Logging

```javascript
const { requestLogger, attachRequestId, responseTime } = require('../middleware');

// Apply to all routes
app.use(attachRequestId);
app.use(requestLogger);
app.use(responseTime);
```

---

## Utilities

### Pagination

```javascript
const { calculatePagination, calculatePaginationMeta } = require('../utils');

const { offset, limit, page, pageSize } = calculatePagination(req.query.page, req.query.pageSize);

const { count, rows } = await Model.findAndCountAll({ offset, limit });

const pagination = calculatePaginationMeta(count, page, pageSize);
```

### Filtering

```javascript
const { buildFilters, buildSearchConditions } = require('../utils');

const filters = buildFilters(req.query, {
  allowedFields: ['status', 'category'],
  fieldMappings: { cat: 'category' }
});

const searchConditions = buildSearchConditions(req.query.search, ['name', 'description']);
```

### Sorting

```javascript
const { buildSortOrder, parseMultiSort } = require('../utils');

const order = buildSortOrder(req.query.sortBy, req.query.sortOrder, {
  allowedFields: ['name', 'createdAt'],
  defaultSort: [['createdAt', 'DESC']]
});
```

### Response Formatting

```javascript
const { formatSuccess, formatPaginated, formatError } = require('../utils');

res.json(formatSuccess(data, 'Operation successful'));
res.json(formatPaginated(items, pagination));
res.status(400).json(formatError('Validation failed', 400, errors));
```

---

## Examples

See the `examples/` directory for complete working examples:

- **simple-crud-api.js**: Basic CRUD API with custom methods
- **authenticated-api.js**: Authentication, authorization, and role-based access control

---

## Best Practices

### 1. Keep Services Focused

Services should contain business logic, not HTTP concerns:

```javascript
// ✅ Good
class UserService extends BaseService {
  async activateUser(id) {
    return this.update(id, { status: 'active', activatedAt: new Date() });
  }
}

// ❌ Bad
class UserService extends BaseService {
  async activateUser(req, res) {
    // Don't handle HTTP in services
  }
}
```

### 2. Use Validation Schemas

Always validate input data:

```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

router.post('/register', validateBody(schema), controller.register);
```

### 3. Handle Errors Consistently

Use the service result pattern:

```javascript
const result = await service.findById(id);

if (!result.success) {
  return controller.sendError(res, result.error, 404);
}

controller.sendSuccess(res, result.data);
```

### 4. Use Transactions for Multiple Operations

```javascript
const { executeTransaction } = require('../shared/utils/database');

await executeTransaction(sequelize, async (transaction) => {
  await service.create(data1, { transaction });
  await service.create(data2, { transaction });
});
```

### 5. Implement Proper Authorization

Check permissions at the route level:

```javascript
router.delete('/:id', 
  requireAuth,
  requireRoles(['admin']),
  controller.delete
);
```

---

## Migration Guide

### Migrating Existing Routes

#### Before (Traditional Express)

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth.requireAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await Product.findAndCountAll({
      limit: pageSize,
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        pageSize,
        total: count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

#### After (Framework)

```javascript
const { BaseRouter, BaseController, BaseService } = require('../../framework/backend/api/base');
const Product = require('../models/Product');

const service = new BaseService({ model: Product });
const controller = new BaseController({ service });
const router = new BaseRouter({ basePath: '/api/products' });

router.registerCrudRoutes(controller);

module.exports = router.getRouter();
```

### Step-by-Step Migration

1. **Create Service**: Wrap your model with BaseService
2. **Create Controller**: Wrap your service with BaseController
3. **Create Router**: Use BaseRouter and register routes
4. **Move Business Logic**: Extract business logic from routes to service methods
5. **Add Validation**: Add Joi schemas for input validation
6. **Test**: Verify all endpoints work as expected

---

## API Response Format

All API responses follow a standard format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "timestamp": "2025-11-15T14:30:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10,
    "hasMore": true
  },
  "timestamp": "2025-11-15T14:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "details": ["Additional error details"],
  "timestamp": "2025-11-15T14:30:00.000Z"
}
```

---

## Common Query Parameters

### Pagination

- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10, max: 100)

### Filtering

- Any field name: Exact match
- `field[operator]`: Operator-based filtering
  - `field[gte]`: Greater than or equal
  - `field[lte]`: Less than or equal
  - `field[like]`: Pattern matching

### Sorting

- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`
- `sort`: Multi-sort format: `field1:asc,field2:desc`

### Searching

- `search`: Search query (searches across configured fields)

### Example

```
GET /api/products?page=2&pageSize=20&search=laptop&category=electronics&sortBy=price&sortOrder=asc
```

---

## Support

For questions or issues, please refer to:
- Framework examples in `examples/`
- Shared utilities documentation
- Project README

---

**Last Updated**: November 15, 2025
