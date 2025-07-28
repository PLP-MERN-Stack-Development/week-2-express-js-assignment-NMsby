// middleware/validation.js - Request validation middleware

const { ErrorFactory } = require('../errors');

// Validate product creation data
const validateProductCreation = (req, res, next) => {
    const { name, description, price, category, inStock } = req.body;
    const errors = [];

    // Required field validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        errors.push('Description is required and must be a non-empty string');
    }

    if (price === undefined || price === null) {
        errors.push('Price is required');
    } else if (typeof price !== 'number' || price <= 0) {
        errors.push('Price must be a positive number');
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        errors.push('Category is required and must be a non-empty string');
    }

    if (inStock === undefined || inStock === null) {
        errors.push('InStock status is required');
    } else if (typeof inStock !== 'boolean') {
        errors.push('InStock must be a boolean value (true or false)');
    }

    // Length validations
    if (name && name.trim().length > 100) {
        errors.push('Name must be less than 100 characters');
    }

    if (description && description.trim().length > 500) {
        errors.push('Description must be less than 500 characters');
    }

    // Price range validation
    if (typeof price === 'number' && (price > 999999 || price < 0.01)) {
        errors.push('Price must be between 0.01 and 999999');
    }

    // Category validation
    const validCategories = ['electronics', 'kitchen', 'clothing', 'books', 'sports', 'toys', 'other'];
    if (category && !validCategories.includes(category.trim().toLowerCase())) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    if (errors.length > 0) {
        return next(ErrorFactory.validation('Product validation failed', errors));
    }

    // Sanitize and normalize data
    req.body = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category.trim().toLowerCase(),
        inStock: Boolean(inStock)
    };

    next();
};

// Validate product update data
const validateProductUpdate = (req, res, next) => {
    const { name, description, price, category, inStock } = req.body;
    const errors = [];

    // Optional field validation (since it's an update)
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            errors.push('Name must be a non-empty string');
        } else if (name.trim().length > 100) {
            errors.push('Name must be less than 100 characters');
        }
    }

    if (description !== undefined) {
        if (typeof description !== 'string' || description.trim().length === 0) {
            errors.push('Description must be a non-empty string');
        } else if (description.trim().length > 500) {
            errors.push('Description must be less than 500 characters');
        }
    }

    if (price !== undefined) {
        if (typeof price !== 'number' || price <= 0) {
            errors.push('Price must be a positive number');
        } else if (price > 999999 || price < 0.01) {
            errors.push('Price must be between 0.01 and 999999');
        }
    }

    if (category !== undefined) {
        const validCategories = ['electronics', 'kitchen', 'clothing', 'books', 'sports', 'toys', 'other'];
        if (typeof category !== 'string' || category.trim().length === 0) {
            errors.push('Category must be a non-empty string');
        } else if (!validCategories.includes(category.trim().toLowerCase())) {
            errors.push(`Category must be one of: ${validCategories.join(', ')}`);
        }
    }

    if (inStock !== undefined && typeof inStock !== 'boolean') {
        errors.push('InStock must be a boolean value (true or false)');
    }

    if (errors.length > 0) {
        return next(ErrorFactory.validation('Product update validation failed', errors));
    }

    // Sanitize and normalize provided data
    const sanitizedData = {};
    if (name !== undefined) sanitizedData.name = name.trim();
    if (description !== undefined) sanitizedData.description = description.trim();
    if (price !== undefined) sanitizedData.price = parseFloat(price);
    if (category !== undefined) sanitizedData.category = category.trim().toLowerCase();
    if (inStock !== undefined) sanitizedData.inStock = Boolean(inStock);

    req.body = sanitizedData;
    next();
};

// Validate ID parameter
const validateProductId = (req, res, next) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        return next(ErrorFactory.validation(
            'Product ID is required and must be a valid string',
            ['Product ID parameter is missing or invalid'],
            'id'
        ));
    }

    // Additional UUID format validation (optional, since we're using UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (id !== '1' && id !== '2' && id !== '3' && !uuidRegex.test(id)) {
        return next(ErrorFactory.validation(
            'Product ID must be a valid UUID format or legacy ID',
            ['ID must be a valid UUID or legacy ID (1, 2, 3)'],
            'id'
        ));
    }

    next();
};

module.exports = {
    validateProductCreation,
    validateProductUpdate,
    validateProductId
};