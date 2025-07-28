// errors/CustomError.js - Base custom error class

class CustomError extends Error {
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', isOperational = true) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    // Convert error to JSON for API responses
    toJSON() {
        return {
            success: false,
            message: this.message,
            error: this.errorCode,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            ...(process.env.NODE_ENV === 'development' && {
                stack: this.stack,
                name: this.name
            })
        };
    }

    // Get HTTP status code
    getHTTPStatusCode() {
        return this.statusCode;
    }

    // Check if error is operational (expected) or programming error
    isOperationalError() {
        return this.isOperational;
    }
}

module.exports = CustomError;