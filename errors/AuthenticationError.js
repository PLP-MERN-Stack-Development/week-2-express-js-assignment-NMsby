// errors/AuthenticationError.js - Authentication error class

const CustomError = require('./CustomError');

class AuthenticationError extends CustomError {
    constructor(message = 'Authentication failed', reason = 'INVALID_CREDENTIALS') {
        super(message, 401, 'AUTHENTICATION_ERROR', true);

        this.reason = reason;
        this.errorType = 'authentication';
    }

    // Create specific authentication errors
    static missingApiKey() {
        return new AuthenticationError(
            'API key is required. Please provide X-API-Key header.',
            'MISSING_API_KEY'
        );
    }

    static invalidApiKey() {
        return new AuthenticationError(
            'Invalid API key provided.',
            'INVALID_API_KEY'
        );
    }

    static expiredApiKey() {
        return new AuthenticationError(
            'API key has expired.',
            'EXPIRED_API_KEY'
        );
    }

    // Override toJSON to include auth details
    toJSON() {
        return {
            ...super.toJSON(),
            reason: this.reason,
            errorType: this.errorType,
            hints: this.getHints()
        };
    }

    // Provide helpful hints
    getHints() {
        const hints = [];

        switch (this.reason) {
            case 'MISSING_API_KEY':
                hints.push('Add header: X-API-Key: dev-key-12345');
                hints.push('Include the API key in your request headers');
                break;
            case 'INVALID_API_KEY':
                hints.push('Use one of: dev-key-12345, test-key-67890, admin-key-abcdef');
                hints.push('Check if your API key is spelled correctly');
                break;
            case 'EXPIRED_API_KEY':
                hints.push('Contact administrator for a new API key');
                hints.push('Check if your subscription is still active');
                break;
        }

        return hints;
    }
}

module.exports = AuthenticationError;