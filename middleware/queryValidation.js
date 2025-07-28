// middleware/queryValidation.js - Advanced query parameter validation

const { ErrorFactory } = require('../errors');
const { QueryProcessor } = require('../utils/queryHelpers');

// Validate pagination parameters
const validatePagination = (req, res, next) => {
    try {
        const pagination = QueryProcessor.parsePagination(req.query);
        req.pagination = pagination;
        next();
    } catch (error) {
        next(ErrorFactory.validation(`Pagination error: ${error.message}`, [error.message], 'pagination'));
    }
};

// Validate filter parameters
const validateFilters = (req, res, next) => {
    try {
        const filters = QueryProcessor.parseFilters(req.query);
        req.filters = filters;
        next();
    } catch (error) {
        next(ErrorFactory.validation(`Filter error: ${error.message}`, [error.message], 'filters'));
    }
};

// Validate search parameters
const validateSearch = (req, res, next) => {
    try {
        const search = QueryProcessor.parseSearch(req.query);
        req.search = search;
        next();
    } catch (error) {
        next(ErrorFactory.validation(`Search error: ${error.message}`, [error.message], 'search'));
    }
};

// Validate sorting parameters
const validateSorting = (req, res, next) => {
    try {
        const sort = QueryProcessor.parseSorting(req.query);
        req.sort = sort;
        next();
    } catch (error) {
        next(ErrorFactory.validation(`Sorting error: ${error.message}`, [error.message], 'sorting'));
    }
};

// Combined validation middleware for product listings
const validateProductQuery = (req, res, next) => {
    try {
        // Parse all query parameters
        req.pagination = QueryProcessor.parsePagination(req.query);
        req.filters = QueryProcessor.parseFilters(req.query);
        req.search = QueryProcessor.parseSearch(req.query);
        req.sort = QueryProcessor.parseSorting(req.query);

        // Log query processing for debugging
        console.log('🔍 QUERY PROCESSING:');
        console.log('===================');
        console.log('Pagination:', req.pagination);
        console.log('Filters:', req.filters);
        console.log('Search:', req.search);
        console.log('Sort:', req.sort);
        console.log('===================\n');

        next();
    } catch (error) {
        next(ErrorFactory.validation(`Query validation error: ${error.message}`, [error.message], 'query'));
    }
};

// Validate statistics query parameters
const validateStatsQuery = (req, res, next) => {
    try {
        const allowedParams = ['category', 'detailed', 'format'];
        const providedParams = Object.keys(req.query);
        const invalidParams = providedParams.filter(param => !allowedParams.includes(param));

        if (invalidParams.length > 0) {
            throw new Error(`Invalid parameters: ${invalidParams.join(', ')}. Allowed: ${allowedParams.join(', ')}`);
        }

        // Validate specific parameters
        if (req.query.detailed && !['true', 'false'].includes(req.query.detailed)) {
            throw new Error('detailed parameter must be "true" or "false"');
        }

        if (req.query.format && !['json', 'summary'].includes(req.query.format)) {
            throw new Error('format parameter must be "json" or "summary"');
        }

        next();
    } catch (error) {
        next(ErrorFactory.validation(`Stats query error: ${error.message}`, [error.message], 'statsQuery'));
    }
};

module.exports = {
    validatePagination,
    validateFilters,
    validateSearch,
    validateSorting,
    validateProductQuery,
    validateStatsQuery
};