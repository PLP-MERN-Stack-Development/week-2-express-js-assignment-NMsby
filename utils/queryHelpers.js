// utils/queryHelpers.js - Query processing and validation utilities

class QueryProcessor {
    // Parse and validate pagination parameters
    static parsePagination(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;

        // Validate pagination parameters
        if (page < 1) {
            throw new Error('Page number must be greater than 0');
        }

        if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }

        return {
            page,
            limit,
            skip,
            offset: skip
        };
    }

    // Parse and validate filter parameters
    static parseFilters(query) {
        const filters = {};

        // Category filter
        if (query.category) {
            const validCategories = ['electronics', 'kitchen', 'clothing', 'books', 'sports', 'toys', 'other'];
            const categories = Array.isArray(query.category)
                ? query.category.map(c => c.toLowerCase())
                : [query.category.toLowerCase()];

            const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
            if (invalidCategories.length > 0) {
                throw new Error(`Invalid categories: ${invalidCategories.join(', ')}. Valid categories: ${validCategories.join(', ')}`);
            }

            filters.category = categories;
        }

        // Price range filter
        if (query.minPrice || query.maxPrice) {
            filters.price = {};

            if (query.minPrice) {
                const minPrice = parseFloat(query.minPrice);
                if (isNaN(minPrice) || minPrice < 0) {
                    throw new Error('minPrice must be a valid positive number');
                }
                filters.price.min = minPrice;
            }

            if (query.maxPrice) {
                const maxPrice = parseFloat(query.maxPrice);
                if (isNaN(maxPrice) || maxPrice < 0) {
                    throw new Error('maxPrice must be a valid positive number');
                }
                filters.price.max = maxPrice;
            }

            if (filters.price.min && filters.price.max && filters.price.min > filters.price.max) {
                throw new Error('minPrice cannot be greater than maxPrice');
            }
        }

        // Stock status filter
        if (query.inStock !== undefined) {
            if (query.inStock === 'true') {
                filters.inStock = true;
            } else if (query.inStock === 'false') {
                filters.inStock = false;
            } else {
                throw new Error('inStock must be "true" or "false"');
            }
        }

        return filters;
    }

    // Parse and validate search parameters
    static parseSearch(query) {
        const search = {};

        if (query.q || query.search) {
            const searchTerm = (query.q || query.search).trim();

            if (searchTerm.length < 2) {
                throw new Error('Search term must be at least 2 characters long');
            }

            if (searchTerm.length > 100) {
                throw new Error('Search term must be less than 100 characters');
            }

            search.term = searchTerm.toLowerCase();
            search.fields = query.fields ? query.fields.split(',') : ['name', 'description'];
        }

        return search;
    }

    // Parse and validate sorting parameters
    static parseSorting(query) {
        const sort = {};

        if (query.sortBy) {
            const validSortFields = ['name', 'price', 'category', 'inStock', 'createdAt', 'updatedAt'];

            if (!validSortFields.includes(query.sortBy)) {
                throw new Error(`Invalid sortBy field. Valid fields: ${validSortFields.join(', ')}`);
            }

            sort.field = query.sortBy;
            sort.order = query.sortOrder === 'desc' ? 'desc' : 'asc';
        } else {
            // Default sorting
            sort.field = 'createdAt';
            sort.order = 'desc';
        }

        return sort;
    }

    // Apply filters to products array
    static applyFilters(products, filters) {
        return products.filter(product => {
            // Category filter
            if (filters.category && !filters.category.includes(product.category)) {
                return false;
            }

            // Price range filter
            if (filters.price) {
                if (filters.price.min && product.price < filters.price.min) {
                    return false;
                }
                if (filters.price.max && product.price > filters.price.max) {
                    return false;
                }
            }

            // Stock status filter
            if (filters.inStock !== undefined && product.inStock !== filters.inStock) {
                return false;
            }

            return true;
        });
    }

    // Apply search to products array
    static applySearch(products, search) {
        if (!search.term) return products;

        return products.filter(product => {
            return search.fields.some(field => {
                const fieldValue = product[field];
                return fieldValue && fieldValue.toString().toLowerCase().includes(search.term);
            });
        });
    }

    // Apply sorting to products array
    static applySorting(products, sort) {
        return products.sort((a, b) => {
            let aValue = a[sort.field];
            let bValue = b[sort.field];

            // Handle different data types
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sort.order === 'desc') {
                return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
            } else {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            }
        });
    }

    // Apply pagination to products array
    static applyPagination(products, pagination) {
        const startIndex = pagination.skip;
        const endIndex = startIndex + pagination.limit;

        return {
            data: products.slice(startIndex, endIndex),
            pagination: {
                currentPage: pagination.page,
                totalPages: Math.ceil(products.length / pagination.limit),
                totalItems: products.length,
                itemsPerPage: pagination.limit,
                hasNextPage: endIndex < products.length,
                hasPrevPage: pagination.page > 1
            }
        };
    }
}

// Generate comprehensive metadata for API responses
class ResponseBuilder {
    static buildListResponse(products, originalQuery, filters, search, sort, pagination) {
        return {
            success: true,
            data: products,
            meta: {
                pagination: pagination,
                filters: {
                    applied: filters,
                    available: {
                        categories: ['electronics', 'kitchen', 'clothing', 'books', 'sports', 'toys', 'other'],
                        priceRange: { min: 0, max: 999999 },
                        stockStatus: [true, false]
                    }
                },
                search: search.term ? {
                    term: search.term,
                    fields: search.fields,
                    resultsFound: products.length
                } : null,
                sorting: {
                    field: sort.field,
                    order: sort.order,
                    availableFields: ['name', 'price', 'category', 'inStock', 'createdAt', 'updatedAt']
                },
                query: originalQuery
            },
            message: `Retrieved ${products.length} product(s) successfully`
        };
    }

    static buildStatsResponse(products, stats) {
        return {
            success: true,
            data: {
                overview: stats.overview,
                byCategory: stats.byCategory,
                pricing: stats.pricing,
                inventory: stats.inventory,
                trends: stats.trends
            },
            meta: {
                totalProducts: products.length,
                generatedAt: new Date().toISOString(),
                dataSource: 'in-memory'
            },
            message: 'Product statistics retrieved successfully'
        };
    }
}

module.exports = {
    QueryProcessor,
    ResponseBuilder
};