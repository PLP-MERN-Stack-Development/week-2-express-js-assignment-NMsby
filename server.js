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
    asyncHandler,
    healthCheckMiddleware
} = require('./middleware/errorHandler');

// Import error handling utilities
const { ErrorFactory } = require('./errors');
const { requestIdMiddleware } = require('./middleware/errorHandler');

// Import query processing utilities
const { QueryProcessor, ResponseBuilder } = require('./utils/queryHelpers');
const StatsCalculator = require('./utils/statsCalculator');
const {
    validateProductQuery,
    validateStatsQuery
} = require('./middleware/queryValidation');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// Apply custom middleware
app.use(logger); // Log all requests
app.use(requestIdMiddleware); // Add request IDs for tracking
app.use(authenticateApiKey); // Authenticate API requests

// Add health check middleware
app.use(healthCheckMiddleware);

// Error statistics endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/error-stats', authenticateApiKey, (req, res) => {
        const stats = require('./utils/errorMetrics').errorMetrics.getStats();
        res.json({
            success: true,
            data: stats,
            message: 'Error statistics retrieved successfully'
        });
    });
}

// Trust proxy for correct IP addresses
app.set('trust proxy', true);

// Sample in-memory products database
let products = [
    {
        id: '1',
        name: 'Gaming Laptop Pro',
        description: 'High-performance gaming laptop with RTX 4070, 16GB RAM, and 1TB SSD',
        price: 1599.99,
        category: 'electronics',
        inStock: true,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
    },
    {
        id: '2',
        name: 'iPhone 15 Pro',
        description: 'Latest Apple smartphone with titanium design and 48MP camera system',
        price: 1199.99,
        category: 'electronics',
        inStock: true,
        createdAt: '2024-01-10T14:20:00Z',
        updatedAt: '2024-01-10T14:20:00Z'
    },
    {
        id: '3',
        name: 'Premium Coffee Maker',
        description: 'Programmable drip coffee maker with thermal carafe and timer',
        price: 89.99,
        category: 'kitchen',
        inStock: false,
        createdAt: '2024-01-08T09:15:00Z',
        updatedAt: '2024-01-20T16:45:00Z'
    },
    {
        id: '4',
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-cancelling headphones with 30-hour battery life',
        price: 249.99,
        category: 'electronics',
        inStock: true,
        createdAt: '2024-01-12T11:00:00Z',
        updatedAt: '2024-01-12T11:00:00Z'
    },
    {
        id: '5',
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable organic cotton t-shirt in various colors and sizes',
        price: 29.99,
        category: 'clothing',
        inStock: true,
        createdAt: '2024-01-18T13:30:00Z',
        updatedAt: '2024-01-18T13:30:00Z'
    },
    {
        id: '6',
        name: 'JavaScript Programming Guide',
        description: 'Complete guide to modern JavaScript programming and web development',
        price: 39.99,
        category: 'books',
        inStock: true,
        createdAt: '2024-01-05T08:45:00Z',
        updatedAt: '2024-01-05T08:45:00Z'
    },
    {
        id: '7',
        name: 'Professional Tennis Racket',
        description: 'High-quality tennis racket used by professional players',
        price: 189.99,
        category: 'sports',
        inStock: false,
        createdAt: '2024-01-14T16:20:00Z',
        updatedAt: '2024-01-22T10:15:00Z'
    },
    {
        id: '8',
        name: 'Stainless Steel Cookware Set',
        description: '10-piece professional stainless steel cookware set with non-stick coating',
        price: 299.99,
        category: 'kitchen',
        inStock: true,
        createdAt: '2024-01-11T12:10:00Z',
        updatedAt: '2024-01-11T12:10:00Z'
    },
    {
        id: '9',
        name: 'Educational Building Blocks',
        description: 'Creative building blocks set for children aged 3-10 years',
        price: 49.99,
        category: 'toys',
        inStock: true,
        createdAt: '2024-01-16T15:25:00Z',
        updatedAt: '2024-01-16T15:25:00Z'
    },
    {
        id: '10',
        name: 'Luxury Leather Jacket',
        description: 'Premium genuine leather jacket with modern fit and design',
        price: 399.99,
        category: 'clothing',
        inStock: false,
        createdAt: '2024-01-07T07:30:00Z',
        updatedAt: '2024-01-21T14:20:00Z'
    }
];

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// GET /api/products - Get all products with filtering, pagination, search, and sorting
app.get('/api/products', validateProductQuery, asyncHandler(async (req, res) => {
    let processedProducts = [...products]; // Create a copy to avoid mutating original

    // Apply search if provided
    if (req.search.term) {
        processedProducts = QueryProcessor.applySearch(processedProducts, req.search);
    }

    // Apply filters if provided
    processedProducts = QueryProcessor.applyFilters(processedProducts, req.filters);

    // Apply sorting
    processedProducts = QueryProcessor.applySorting(processedProducts, req.sort);

    // Apply pagination
    const result = QueryProcessor.applyPagination(processedProducts, req.pagination);

    // Build comprehensive response
    const response = ResponseBuilder.buildListResponse(
        result.data,
        req.query,
        req.filters,
        req.search,
        req.sort,
        result.pagination
    );

    res.status(200).json(response);
}));

// GET /api/products/search - Dedicated search endpoint
app.get('/api/products/search', validateProductQuery, asyncHandler(async (req, res) => {
    // Require search term for this endpoint
    if (!req.search.term) {
        throw ErrorFactory.validation('Search term is required', ['Query parameter "q" or "search" is required'], 'search');
    }

    let searchResults = [...products];

    // Apply search
    searchResults = QueryProcessor.applySearch(searchResults, req.search);

    // Apply additional filters if provided
    searchResults = QueryProcessor.applyFilters(searchResults, req.filters);

    // Apply sorting (relevance-based for search)
    searchResults = QueryProcessor.applySorting(searchResults, req.sort);

    // Apply pagination
    const result = QueryProcessor.applyPagination(searchResults, req.pagination);

    // Search response
    const response = {
        success: true,
        data: result.data,
        meta: {
            search: {
                term: req.search.term,
                fields: req.search.fields,
                resultsFound: searchResults.length,
                searchTime: `${Date.now() - req.startTime}ms`
            },
            pagination: result.pagination,
            filters: req.filters,
            suggestions: searchResults.length === 0 ? [
                'Try using different keywords',
                'Check for spelling errors',
                'Use broader search terms',
                'Browse categories: ' + [...new Set(products.map(p => p.category))].join(', ')
            ] : null
        },
        message: `Found ${result.data.length} product(s) matching "${req.search.term}"`
    };

    res.status(200).json(response);
}));

// GET /api/products/stats - Product statistics endpoint
app.get('/api/products/stats', validateStatsQuery, asyncHandler(async (req, res) => {
    let analyticsProducts = [...products];

    // Apply category filter if provided
    if (req.query.category) {
        const categories = Array.isArray(req.query.category)
            ? req.query.category.map(c => c.toLowerCase())
            : [req.query.category.toLowerCase()];

        analyticsProducts = analyticsProducts.filter(p => categories.includes(p.category));
    }

    // Calculate comprehensive statistics
    const stats = StatsCalculator.calculateProductStats(analyticsProducts);

    // Handle format parameter
    if (req.query.format === 'summary') {
        const summary = {
            success: true,
            data: {
                totalProducts: stats.overview.totalProducts,
                inStock: stats.overview.inStockProducts,
                averagePrice: stats.overview.averagePrice,
                categories: Object.keys(stats.byCategory).length,
                topCategory: Object.entries(stats.byCategory)
                    .sort(([,a], [,b]) => b.count - a.count)[0]?.[0] || 'N/A'
            },
            message: 'Product statistics summary'
        };
        return res.status(200).json(summary);
    }

    // Full detailed response
    const response = ResponseBuilder.buildStatsResponse(analyticsProducts, stats);

    // Add additional metadata if detailed=true
    if (req.query.detailed === 'true') {
        response.data.rawData = {
            sampleProducts: analyticsProducts.slice(0, 5),
            queryParameters: req.query,
            calculationTime: new Date().toISOString()
        };
    }

    res.status(200).json(response);
}));

// GET /api/products/categories - Get all available categories with counts
app.get('/api/products/categories', asyncHandler(async (req, res) => {
    const categoryStats = {};

    products.forEach(product => {
        if (!categoryStats[product.category]) {
            categoryStats[product.category] = {
                name: product.category,
                count: 0,
                inStock: 0,
                averagePrice: 0,
                priceRange: { min: Infinity, max: -Infinity }
            };
        }

        const stats = categoryStats[product.category];
        stats.count++;
        if (product.inStock) stats.inStock++;
        stats.priceRange.min = Math.min(stats.priceRange.min, product.price);
        stats.priceRange.max = Math.max(stats.priceRange.max, product.price);
    });

    // Calculate averages and format
    Object.values(categoryStats).forEach(stats => {
        const categoryProducts = products.filter(p => p.category === stats.name);
        const totalValue = categoryProducts.reduce((sum, p) => sum + p.price, 0);
        stats.averagePrice = parseFloat((totalValue / stats.count).toFixed(2));

        if (stats.priceRange.min === Infinity) stats.priceRange.min = 0;
        if (stats.priceRange.max === -Infinity) stats.priceRange.max = 0;
    });

    res.status(200).json({
        success: true,
        data: Object.values(categoryStats).sort((a, b) => b.count - a.count),
        meta: {
            totalCategories: Object.keys(categoryStats).length,
            totalProducts: products.length
        },
        message: 'Categories retrieved successfully'
    });
}));

// GET /api/products/:id - Get a specific product by ID
app.get('/api/products/:id', validateProductId, asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = products.find(p => p.id === productId);

    if (!product) {
        throw ErrorFactory.notFound('Product', productId);
    }

    // Response with related products
    const relatedProducts = products
        .filter(p => p.id !== productId && p.category === product.category)
        .slice(0, 3)
        .map(p => ({ id: p.id, name: p.name, price: p.price }));

    res.status(200).json({
        success: true,
        data: product,
        meta: {
            relatedProducts: relatedProducts,
            category: product.category,
            priceComparison: {
                isAboveAverage: product.price > (products.reduce((sum, p) => sum + p.price, 0) / products.length),
                categoryAverage: parseFloat((products
                    .filter(p => p.category === product.category)
                    .reduce((sum, p) => sum + p.price, 0) / products.filter(p => p.category === product.category).length).toFixed(2))
            }
        },
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
            inStock: inStock,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
            throw ErrorFactory.notFound('Product', productId);
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
            throw ErrorFactory.notFound('Product', productId);
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

// API Documentation endpoint
app.get('/docs', (req, res) => {
    const documentation = {
        title: 'Products API Documentation',
        version: '1.0.0',
        baseUrl: `${req.protocol}://${req.get('host')}`,
        authentication: {
            type: 'API Key',
            header: 'X-API-Key',
            validKeys: ['dev-key-12345', 'test-key-67890', 'admin-key-abcdef']
        },
        endpoints: {
            products: {
                'GET /api/products': {
                    description: 'Get all products with advanced filtering, sorting, pagination, and search',
                    parameters: {
                        page: 'Page number (default: 1)',
                        limit: 'Items per page (default: 10, max: 100)',
                        category: 'Filter by category (electronics, kitchen, clothing, books, sports, toys, other)',
                        minPrice: 'Minimum price filter',
                        maxPrice: 'Maximum price filter',
                        inStock: 'Filter by stock status (true/false)',
                        sortBy: 'Sort field (name, price, category, inStock, createdAt, updatedAt)',
                        sortOrder: 'Sort order (asc/desc)',
                        q: 'Search term (minimum 2 characters)',
                        fields: 'Search fields (name,description)'
                    },
                    example: '/api/products?category=electronics&inStock=true&sortBy=price&sortOrder=asc&page=1&limit=5'
                },
                'GET /api/products/search': {
                    description: 'Dedicated search endpoint for products',
                    parameters: {
                        q: 'Search term (required)',
                        fields: 'Fields to search in (name,description)',
                        'All /api/products parameters': 'Supports all filtering and pagination options'
                    },
                    example: '/api/products/search?q=gaming&category=electronics&page=1&limit=10'
                },
                'GET /api/products/stats': {
                    description: 'Get comprehensive product statistics and analytics',
                    parameters: {
                        category: 'Filter stats by category',
                        format: 'Response format (json/summary)',
                        detailed: 'Include detailed information (true/false)'
                    },
                    example: '/api/products/stats?detailed=true&format=json'
                },
                'GET /api/products/categories': {
                    description: 'Get all product categories with statistics',
                    example: '/api/products/categories'
                },
                'GET /api/products/:id': {
                    description: 'Get a single product by ID with related products',
                    example: '/api/products/1'
                },
                'POST /api/products': {
                    description: 'Create a new product (requires write permission)',
                    body: {
                        name: 'string (required)',
                        description: 'string (required)',
                        price: 'number (required)',
                        category: 'string (required)',
                        inStock: 'boolean (required)'
                    }
                },
                'PUT /api/products/:id': {
                    description: 'Update an existing product (requires write permission)',
                    body: 'Any combination of the POST fields'
                },
                'DELETE /api/products/:id': {
                    description: 'Delete a product (requires delete permission - admin only)'
                }
            },
            utility: {
                'GET /health': {
                    description: 'API health check with error metrics'
                },
                'GET /api/error-stats': {
                    description: 'Error statistics (development only)'
                },
                'GET /docs': {
                    description: 'API documentation (this endpoint)'
                }
            }
        },
        responseFormat: {
            success: {
                success: true,
                data: 'Response data',
                meta: 'Metadata (pagination, filters, etc.)',
                message: 'Success message'
            },
            error: {
                success: false,
                message: 'Error message',
                error: 'Error code',
                details: 'Error details (development only)'
            }
        }
    };

    res.json(documentation);
});

// Error handling middleware
app.use(notFoundHandler); // Handle 404 errors
app.use(globalErrorHandler); // Global error handler

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app; 