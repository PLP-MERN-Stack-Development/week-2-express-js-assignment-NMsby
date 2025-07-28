// errors/index.js - Error factory and utilities

const CustomError = require('./CustomError');
const ValidationError = require('./ValidationError');
const NotFoundError = require('./NotFoundError');
const AuthenticationError = require('./AuthenticationError');
const AuthorizationError = require('./AuthorizationError');

// Error factory class
class ErrorFactory {
    // Create validation error
    static validation(message, details = [], field = null) {
        return new ValidationError(message, details, field);
    }

    // Create not found error
    static notFound(resource = 'Resource', resourceId = null) {
        return new NotFoundError(resource, resourceId);
    }

    // Create authentication error
    static authentication(message, reason) {
        return new AuthenticationError(message, reason);
    }

    // Create authorization error
    static authorization(message, permission = null, role = null) {
        return new AuthorizationError(message, permission, role);
    }

    // Create generic custom error
    static custom(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
        return new CustomError(message, statusCode, errorCode);
    }

    // Parse and enhance native errors
    static fromNativeError(error) {
        if (error instanceof CustomError) {
            return error;
        }

        // Handle specific native error types
        switch (error.name) {
            case 'ValidationError':
                return new ValidationError(error.message, [error.message]);
            case 'CastError':
                return new ValidationError('Invalid data format', [error.message]);
            case 'SyntaxError':
                if (error.message.includes('JSON')) {
                    return new ValidationError('Invalid JSON format', ['Request body must be valid JSON']);
                }
                break;
        }

        // Default to custom error
        return new CustomError(
            error.message || 'Internal server error',
            error.statusCode || 500,
            error.code || 'INTERNAL_ERROR'
        );
    }
}

// Error type checker utilities
class ErrorUtils {
    // Check if error is operational
    static isOperational(error) {
        return error instanceof CustomError && error.isOperationalError();
    }

    // Get error severity level
    static getSeverity(error) {
        if (!(error instanceof CustomError)) return 'high';

        const statusCode = error.getHTTPStatusCode();

        if (statusCode >= 500) return 'high';
        if (statusCode >= 400) return 'medium';
        return 'low';
    }

    // Check if error should be logged
    static shouldLog(error) {
        const severity = this.getSeverity(error);
        return severity === 'high' || !this.isOperational(error);
    }

    // Sanitize error for production
    static sanitizeForProduction(error) {
        if (!(error instanceof CustomError)) {
            return new CustomError('Internal server error', 500, 'INTERNAL_ERROR');
        }

        // Don't expose sensitive information in production
        const sanitized = error.toJSON();
        delete sanitized.stack;
        delete sanitized.name;

        return sanitized;
    }
}

module.exports = {
    CustomError,
    ValidationError,
    NotFoundError,
    AuthenticationError,
    AuthorizationError,
    ErrorFactory,
    ErrorUtils
};