// errors/ValidationError.js - Validation error class

const CustomError = require('./CustomError');

class ValidationError extends CustomError {
    constructor(message, details = [], field = null) {
        super(message, 400, 'VALIDATION_ERROR', true);

        this.details = Array.isArray(details) ? details : [details];
        this.field = field;
        this.errorType = 'validation';
    }

    // Add validation detail
    addDetail(detail) {
        this.details.push(detail);
        return this;
    }

    // Set field that caused the error
    setField(field) {
        this.field = field;
        return this;
    }

    // Override toJSON to include validation details
    toJSON() {
        return {
            ...super.toJSON(),
            details: this.details,
            ...(this.field && { field: this.field }),
            errorType: this.errorType
        };
    }
}

module.exports = ValidationError;