/**
 * Simple CRUD API Example
 * Demonstrates basic usage of the API framework
 */

const express = require('express');
const { BaseRouter, BaseController, BaseService } = require('../base');
const { requireAuth, validateBody } = require('../middleware');
const Joi = require('joi');

// Example: Products API

/**
 * Step 1: Define your Sequelize model (assumed to exist)
 * const Product = sequelize.define('Product', {
 *   name: DataTypes.STRING,
 *   description: DataTypes.TEXT,
 *   price: DataTypes.DECIMAL,
 *   stock: DataTypes.INTEGER,
 *   category: DataTypes.STRING
 * });
 */

/**
 * Step 2: Create a Service
 * Handles business logic and database operations
 */
class ProductService extends BaseService {
  constructor(model) {
    super({
      model,
      searchFields: ['name', 'description', 'category'],
      defaultOrder: [['name', 'ASC']]
    });
  }

  // Add custom business logic methods
  async findByCategory(category, options = {}) {
    return this.findAll({
      ...options,
      filters: { category }
    });
  }

  async updateStock(id, quantity) {
    const result = await this.findById(id);
    if (!result.success) {
      return result;
    }

    const product = result.data;
    const newStock = product.stock + quantity;

    if (newStock < 0) {
      return {
        success: false,
        error: 'Insufficient stock'
      };
    }

    return this.update(id, { stock: newStock });
  }
}

/**
 * Step 3: Create a Controller
 * Handles HTTP requests and responses
 */
class ProductController extends BaseController {
  constructor(service) {
    super({
      service,
      searchFields: ['name', 'description', 'category']
    });

    // Bind custom methods
    this.getByCategory = this.getByCategory.bind(this);
    this.updateStock = this.updateStock.bind(this);
  }

  // Add custom route handlers
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

  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const result = await this.service.updateStock(id, quantity);

      if (!result.success) {
        return this.sendError(res, result.error, 400);
      }

      this.sendSuccess(res, result.data, { message: 'Stock updated successfully' });
    } catch (error) {
      this.sendError(res, error.message, 500);
    }
  }
}

/**
 * Step 4: Create validation schemas
 */
const productSchemas = {
  create: Joi.object({
    name: Joi.string().required().max(255),
    description: Joi.string().optional(),
    price: Joi.number().positive().required(),
    stock: Joi.number().integer().min(0).required(),
    category: Joi.string().required()
  }),

  update: Joi.object({
    name: Joi.string().max(255),
    description: Joi.string(),
    price: Joi.number().positive(),
    stock: Joi.number().integer().min(0),
    category: Joi.string()
  }),

  updateStock: Joi.object({
    quantity: Joi.number().integer().required()
  })
};

/**
 * Step 5: Create a Router and register routes
 */
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
      },
      searchFields: ['name', 'description', 'category']
    });

    // Register custom routes
    this.get('/category/:category', this.controller.getByCategory);
    this.post('/:id/stock', this.controller.updateStock, [
      validateBody(productSchemas.updateStock)
    ]);

    // Register bulk operations
    this.registerBulkRoutes(this.controller);
  }
}

/**
 * Step 6: Initialize and export
 * Usage in your Express app:
 * 
 * const Product = require('./models/Product');
 * const { createProductRouter } = require('./routes/products');
 * 
 * const productRouter = createProductRouter(Product);
 * app.use('/api/products', productRouter.getRouter());
 */
function createProductRouter(ProductModel) {
  const service = new ProductService(ProductModel);
  const controller = new ProductController(service);
  const router = new ProductRouter(controller);
  
  return router;
}

module.exports = {
  ProductService,
  ProductController,
  ProductRouter,
  createProductRouter
};

/**
 * API Endpoints Created:
 * 
 * GET    /api/products              - List all products (with pagination, search, filters)
 * GET    /api/products/:id          - Get a single product
 * POST   /api/products              - Create a new product
 * PUT    /api/products/:id          - Update a product
 * DELETE /api/products/:id          - Delete a product
 * POST   /api/products/bulk         - Bulk create products
 * PUT    /api/products/bulk         - Bulk update products
 * DELETE /api/products/bulk         - Bulk delete products
 * GET    /api/products/category/:category - Get products by category
 * POST   /api/products/:id/stock    - Update product stock
 * 
 * All routes require authentication by default.
 */
