// middleware/auth.js - API authentication middleware

const { ErrorFactory } = require('../errors');

// Simple API key authentication middleware
const authenticateApiKey = (req, res, next) => {
    // Skip authentication for root route and docs
    if (req.path === '/' || req.path === '/docs') {
        return next();
    }

    // Get API key from headers
    const apiKey = req.get('X-API-Key') || req.get('Authorization');

    // Define valid API keys (In production, store these securely)
    const validApiKeys = [
        'dev-key-12345',
        'test-key-67890',
        'admin-key-abcdef'
    ];

    // Check if API key is provided
    if (!apiKey) {
        return next(ErrorFactory.authentication(
            'API key is required. Please provide X-API-Key header.',
            'MISSING_API_KEY'
        ));
    }

    // Validate API key
    if (!validApiKeys.includes(apiKey)) {
        return next(ErrorFactory.authentication(
            'Invalid API key provided.',
            'INVALID_API_KEY'
        ));
    }

    // Set user context based on API key
    req.user = {
        apiKey: apiKey,
        role: apiKey.includes('admin') ? 'admin' : 'user',
        permissions: apiKey.includes('admin') ? ['read', 'write', 'delete'] : ['read', 'write']
    };

    console.log(`🔐 Authenticated request with API key: ${apiKey}`);
    next();
};

// Permission-based authorization middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions.includes(permission)) {
            return next(ErrorFactory.authorization(
                `Access denied. Required permission: ${permission}`,
                permission
            ));
        }

        next();
    };
};

// Role-based authorization middleware
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ErrorFactory.authentication('Authentication required', 'NOT_AUTHENTICATED'));
        }

        if (req.user.role !== role && req.user.role !== 'admin') {
            return next(ErrorFactory.authorization(
                `Access denied. Required role: ${role}`,
                null,
                role
            ));
        }

        next();
    };
};

module.exports = {
    authenticateApiKey,
    requireRole,
    requirePermission
};