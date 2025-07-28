// config/errorConfig.js - Error handling configuration

const errorConfig = {
    development: {
        includeStackTrace: true,
        includeErrorDetails: true,
        logLevel: 'debug',
        exposeSensitiveInfo: true,
        enableVerboseLogging: true
    },

    production: {
        includeStackTrace: false,
        includeErrorDetails: false,
        logLevel: 'error',
        exposeSensitiveInfo: false,
        enableVerboseLogging: false,

        // Generic messages for security
        genericMessages: {
            500: 'Internal server error occurred',
            400: 'Bad request',
            401: 'Authentication required',
            403: 'Access forbidden',
            404: 'Resource not found'
        }
    },

    test: {
        includeStackTrace: true,
        includeErrorDetails: true,
        logLevel: 'silent',
        exposeSensitiveInfo: false,
        enableVerboseLogging: false
    }
};

// Get current environment configuration
const getCurrentConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    return errorConfig[env] || errorConfig.development;
};

// Error severity levels
const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Error categories
const ErrorCategories = {
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    NOT_FOUND: 'not_found',
    BUSINESS_LOGIC: 'business_logic',
    SYSTEM: 'system',
    EXTERNAL: 'external'
};

module.exports = {
    errorConfig,
    getCurrentConfig,
    ErrorSeverity,
    ErrorCategories
};