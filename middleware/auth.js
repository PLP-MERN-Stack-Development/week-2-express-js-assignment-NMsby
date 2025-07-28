// middleware/auth.js - API authentication middleware

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
        return res.status(401).json({
            success: false,
            message: 'API key is required. Please provide X-API-Key header.',
            error: 'MISSING_API_KEY',
            hint: 'Add header: X-API-Key: dev-key-12345'
        });
    }

    // Validate API key
    if (!validApiKeys.includes(apiKey)) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API key provided.',
            error: 'INVALID_API_KEY',
            hint: 'Use one of: dev-key-12345, test-key-67890, admin-key-abcdef'
        });
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

// Role-based authorization middleware
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'NOT_AUTHENTICATED'
            });
        }

        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${role}`,
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

// Permission-based authorization middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required permission: ${permission}`,
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

module.exports = {
    authenticateApiKey,
    requireRole,
    requirePermission
};