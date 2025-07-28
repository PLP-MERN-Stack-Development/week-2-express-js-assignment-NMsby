// errors/AuthorizationError.js - Authorization error class

const CustomError = require('./CustomError');

class AuthorizationError extends CustomError {
    constructor(message = 'Access denied', requiredPermission = null, requiredRole = null) {
        super(message, 403, 'AUTHORIZATION_ERROR', true);

        this.requiredPermission = requiredPermission;
        this.requiredRole = requiredRole;
        this.errorType = 'authorization';
    }

    // Create specific authorization errors
    static insufficientPermissions(permission) {
        return new AuthorizationError(
            `Access denied. Required permission: ${permission}`,
            permission
        );
    }

    static insufficientRole(role) {
        return new AuthorizationError(
            `Access denied. Required role: ${role}`,
            null,
            role
        );
    }

    // Override toJSON to include authorization details
    toJSON() {
        return {
            ...super.toJSON(),
            ...(this.requiredPermission && { requiredPermission: this.requiredPermission }),
            ...(this.requiredRole && { requiredRole: this.requiredRole }),
            errorType: this.errorType,
            solutions: this.getSolutions()
        };
    }

    // Provide solutions
    getSolutions() {
        const solutions = [];

        if (this.requiredPermission) {
            solutions.push(`Ensure your API key has '${this.requiredPermission}' permission`);
            solutions.push('Contact administrator to upgrade your access level');
        }

        if (this.requiredRole) {
            solutions.push(`This operation requires '${this.requiredRole}' role`);
            solutions.push('Use an API key with appropriate role privileges');
        }

        solutions.push('Check the API documentation for required permissions');

        return solutions;
    }
}

module.exports = AuthorizationError;