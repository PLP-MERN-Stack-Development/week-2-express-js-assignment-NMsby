// middleware/errorHandler.js - Global error handling middleware

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
    console.error('\n🚨 ERROR OCCURRED:');
    console.error('==================');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('Request URL:', req.originalUrl);
    console.error('Request Method:', req.method);
    console.error('Request IP:', req.ip);
    console.error('==================\n');

    // Default error response
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorCode = err.code || 'INTERNAL_ERROR';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errorCode = 'VALIDATION_ERROR';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
        errorCode = 'INVALID_FORMAT';
    } else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate resource';
        errorCode = 'DUPLICATE_ERROR';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        error: errorCode,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
    });
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    globalErrorHandler,
    notFoundHandler,
    asyncHandler
};