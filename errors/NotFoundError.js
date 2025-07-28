// errors/NotFoundError.js - Resource not found error class

const CustomError = require('./CustomError');

class NotFoundError extends CustomError {
    constructor(resource = 'Resource', resourceId = null) {
        const message = resourceId
            ? `${resource} with ID '${resourceId}' not found`
            : `${resource} not found`;

        super(message, 404, 'RESOURCE_NOT_FOUND', true);

        this.resource = resource;
        this.resourceId = resourceId;
        this.errorType = 'not_found';
    }

    // Override toJSON to include resource details
    toJSON() {
        return {
            ...super.toJSON(),
            resource: this.resource,
            ...(this.resourceId && { resourceId: this.resourceId }),
            errorType: this.errorType,
            suggestions: this.getSuggestions()
        };
    }

    // Provide helpful suggestions
    getSuggestions() {
        const suggestions = [];

        if (this.resource === 'Product') {
            suggestions.push('Check if the product ID is correct');
            suggestions.push('Use GET /api/products to list all available products');
            suggestions.push('Ensure the product exists and hasn\'t been deleted');
        }

        if (this.resource === 'Route') {
            suggestions.push('Check the API documentation for valid endpoints');
            suggestions.push('Ensure you\'re using the correct HTTP method');
            suggestions.push('Verify the URL path is correct');
        }

        return suggestions;
    }
}

module.exports = NotFoundError;