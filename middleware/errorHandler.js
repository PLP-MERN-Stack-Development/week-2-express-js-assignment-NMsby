// middleware/errorHandler.js - Global error handling middleware

const { ErrorFactory, ErrorUtils, CustomError } = require('../errors');
const { getCurrentConfig } = require('../config/errorConfig');
const { errorMetrics } = require('../utils/errorMetrics');

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
    // Convert native errors to custom errors
    const customError = ErrorFactory.fromNativeError(err);
    const config = getCurrentConfig();

    // Record error metrics
    const errorRecord = errorMetrics.recordError(customError, req);

    // Log error if necessary
    if (ErrorUtils.shouldLog(customError) && config.enableVerboseLogging) {
        console.error('\n🚨 CRITICAL ERROR OCCURRED:');
        console.error('================================');
        console.error('Request ID:', req.id || 'unknown');
        console.error('Error ID:', errorRecord.timestamp);
        console.error('Error Name:', customError.name);
        console.error('Error Message:', customError.message);
        console.error('Status Code:', customError.getHTTPStatusCode());
        console.error('Error Code:', customError.errorCode);
        console.error('Timestamp:', customError.timestamp);
        console.error('Request URL:', req.originalUrl);
        console.error('Request Method:', req.method);
        console.error('Request IP:', req.ip);
        console.error('User Agent:', req.get('User-Agent'));

        if (req.user) {
            console.error('User API Key:', req.user.apiKey);
            console.error('User Role:', req.user.role);
        }

        if (config.includeStackTrace && ErrorUtils.getSeverity(customError) === 'high') {
            console.error('Stack Trace:', customError.stack);
        }

        console.error('================================\n');
    } else if (config.logLevel !== 'silent') {
        // Log operational errors at info level
        console.log('\n📝 OPERATIONAL ERROR:');
        console.log('====================');
        console.log(`${customError.errorCode}: ${customError.message}`);
        console.log(`${req.method} ${req.originalUrl} - ${customError.getHTTPStatusCode()}`);
        console.log(`Request ID: ${req.id}`);
        console.log('====================\n');
    }

    // Check for high error rate and alert
    if (errorMetrics.isErrorRateHigh(2.0)) {
        console.warn('\n⚠️  HIGH ERROR RATE DETECTED:');
        console.warn('============================');
        console.warn('Error rate is above threshold (2 errors/minute)');
        console.warn('Current rate:', errorMetrics.getErrorRate('lastHour'), 'errors/minute');
        console.warn('============================\n');
    }

    // Prepare response based on environment
    let errorResponse;

    if (process.env.NODE_ENV === 'production') {
        errorResponse = ErrorUtils.sanitizeForProduction(customError);

        // Use generic messages for security in production
        if (config.genericMessages && customError.getHTTPStatusCode() >= 500) {
            errorResponse.message = config.genericMessages[customError.getHTTPStatusCode()] ||
                config.genericMessages[500];
        }
    } else {
        errorResponse = customError.toJSON();
    }

    // Add request context to error response
    errorResponse.requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    errorResponse.path = req.originalUrl;
    errorResponse.method = req.method;
    errorResponse.timestamp = new Date().toISOString();

    // Add helpful debug information in development
    if (config.includeErrorDetails) {
        errorResponse.debug = {
            errorId: errorRecord.timestamp,
            severity: ErrorUtils.getSeverity(customError),
            operational: ErrorUtils.isOperational(customError),
            ...(req.user && { user: { role: req.user.role, apiKey: req.user.apiKey } })
        };
    }

    // Send error response
    res.status(customError.getHTTPStatusCode()).json(errorResponse);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
    const error = ErrorFactory.notFound('Route', `${req.method} ${req.originalUrl}`);
    next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            // Add context to async errors
            error.context = {
                route: req.route?.path,
                method: req.method,
                params: req.params,
                query: req.query,
                timestamp: new Date().toISOString()
            };
            next(error);
        });
    };
};

// Request ID middleware (for error tracking)
const requestIdMiddleware = (req, res, next) => {
    req.id = req.get('X-Request-ID') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.set('X-Request-ID', req.id);
    next();
};

// Health check middleware to expose error metrics
const healthCheckMiddleware = (req, res, next) => {
    if (req.path === '/health' || req.path === '/api/health') {
        const stats = errorMetrics.getStats();
        return res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            errors: {
                total: stats.summary.totalErrors,
                lastHour: stats.summary.errorsLastHour,
                rate: errorMetrics.getErrorRate('lastHour').toFixed(2) + ' errors/min',
                highErrorRate: errorMetrics.isErrorRateHigh(2.0)
            }
        });
    }
    next();
};

// Error boundary for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n🚨 UNHANDLED PROMISE REJECTION:');
    console.error('===============================');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    console.error('Time:', new Date().toISOString());
    console.error('===============================\n');

    // Record in metrics
    errorMetrics.recordError(new Error(`Unhandled Promise Rejection: ${reason}`), null);

    // Graceful shutdown
    process.exit(1);
});

// Error boundary for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('\n🚨 UNCAUGHT EXCEPTION:');
    console.error('======================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Time:', new Date().toISOString());
    console.error('======================\n');

    // Record in metrics
    errorMetrics.recordError(error, null);

    // Graceful shutdown
    process.exit(1);
});

module.exports = {
    globalErrorHandler,
    notFoundHandler,
    asyncHandler,
    requestIdMiddleware,
    healthCheckMiddleware
};