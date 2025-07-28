// server.js - Starter Express server for Week 2 assignment

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Import custom middleware
const logger = require('./middleware/logger');
const { authenticateApiKey, requirePermission } = require('./middleware/auth');
const {
  validateProductCreation,
  validateProductUpdate,
  validateProductId
} = require('./middleware/validation');
const {
  globalErrorHandler,
  notFoundHandler,
  asyncHandler
} = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// Apply custom middleware
app.use(logger); // Log all requests
app.use(authenticateApiKey); // Authenticate API requests

// Trust proxy for correct IP addresses
app.set('trust proxy', true);

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// GET /api/products - Get all products
app.get('/api/products', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: products,
    count: products.length,
    message: 'Products retrieved successfully'
  });
}));

// GET /api/products/:id - Get a specific product by ID
app.get('/api/products/:id', validateProductId, asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: `Product with ID ${productId} not found`,
      error: 'PRODUCT_NOT_FOUND'
    });
  }

  res.status(200).json({
    success: true,
    data: product,
    message: 'Product retrieved successfully'
  });
}));

// POST /api/products - Create a new product
app.post('/api/products',
    requirePermission('write'),
    validateProductCreation,
    asyncHandler(async (req, res) => {
      const { name, description, price, category, inStock } = req.body;

      // Create new product
      const newProduct = {
        id: uuidv4(),
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category.trim().toLowerCase(),
        inStock: inStock
      };

      products.push(newProduct);

      res.status(201).json({
        success: true,
        data: newProduct,
        message: 'Product created successfully'
      });
    })
);

// PUT /api/products/:id - Update an existing product
app.put('/api/products/:id',
    requirePermission('write'),
    validateProductId,
    validateProductUpdate,
    asyncHandler(async (req, res) => {
      const productId = req.params.id;
      // Find the product
      const productIndex = products.findIndex(p => p.id === productId);

      if (productIndex === -1) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found`,
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      // Update the product (only update provided fields)
      const updatedProduct = {
        ...products[productIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      products[productIndex] = updatedProduct;

      res.status(200).json({
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
      });
    })
);

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id',
    requirePermission('delete'),
    validateProductId,
    asyncHandler(async (req, res) => {
      const productId = req.params.id;
      // Find the product
      const productIndex = products.findIndex(p => p.id === productId);

      if (productIndex === -1) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found`,
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      // Remove the product
      const deletedProduct = products.splice(productIndex, 1)[0];

      res.status(200).json({
        success: true,
        data: deletedProduct,
        message: 'Product deleted successfully'
      });
    })
);

// Error handling middleware
app.use(notFoundHandler); // Handle 404 errors
app.use(globalErrorHandler); // Global error handler

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app; 