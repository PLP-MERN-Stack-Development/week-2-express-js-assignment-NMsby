// server.js - Starter Express server for Week 2 assignment

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

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
app.get('/api/products', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving products',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get a specific product by ID
app.get('/api/products/:id', (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the product',
      error: error.message
    });
  }
});

// POST /api/products - Create a new product
app.post('/api/products', (req, res) => {
  try {
    const { name, description, price, category, inStock } = req.body;

    // Basic validation
    if (!name || !description || !price || !category || inStock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price, category, inStock',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate data types
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number',
        error: 'INVALID_PRICE'
      });
    }

    if (typeof inStock !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'inStock must be a boolean value',
        error: 'INVALID_STOCK_STATUS'
      });
    }

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the product',
      error: error.message
    });
  }
});

// PUT /api/products/:id - Update an existing product
app.put('/api/products/:id', (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, category, inStock } = req.body;

    // Find the product
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`,
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    // Validate data if provided
    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number',
        error: 'INVALID_PRICE'
      });
    }

    if (inStock !== undefined && typeof inStock !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'inStock must be a boolean value',
        error: 'INVALID_STOCK_STATUS'
      });
    }

    // Update the product (only update provided fields)
    const updatedProduct = {
      ...products[productIndex],
      ...(name && { name: name.trim() }),
      ...(description && { description: description.trim() }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(category && { category: category.trim().toLowerCase() }),
      ...(inStock !== undefined && { inStock: inStock })
    };

    products[productIndex] = updatedProduct;

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the product',
      error: error.message
    });
  }
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the product',
      error: error.message
    });
  }
});

// TODO: Implement custom middleware for:
// - Request logging
// - Authentication
// - Error handling

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app; 