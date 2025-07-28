// utils/statsCalculator.js - Product statistics and analytics

class StatsCalculator {
    // Calculate comprehensive product statistics
    static calculateProductStats(products) {
        const stats = {
            overview: this.calculateOverview(products),
            byCategory: this.calculateCategoryStats(products),
            pricing: this.calculatePricingStats(products),
            inventory: this.calculateInventoryStats(products),
            trends: this.calculateTrends(products)
        };

        return stats;
    }

    // Calculate overview statistics
    static calculateOverview(products) {
        const totalProducts = products.length;
        const inStockProducts = products.filter(p => p.inStock).length;
        const outOfStockProducts = totalProducts - inStockProducts;

        const totalValue = products.reduce((sum, p) => sum + p.price, 0);
        const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

        const uniqueCategories = [...new Set(products.map(p => p.category))].length;

        return {
            totalProducts,
            inStockProducts,
            outOfStockProducts,
            stockPercentage: totalProducts > 0 ? ((inStockProducts / totalProducts) * 100).toFixed(2) : 0,
            totalValue: parseFloat(totalValue.toFixed(2)),
            averagePrice: parseFloat(averagePrice.toFixed(2)),
            uniqueCategories
        };
    }

    // Calculate category-based statistics
    static calculateCategoryStats(products) {
        const categoryStats = {};

        products.forEach(product => {
            const category = product.category;

            if (!categoryStats[category]) {
                categoryStats[category] = {
                    count: 0,
                    inStock: 0,
                    outOfStock: 0,
                    totalValue: 0,
                    averagePrice: 0,
                    minPrice: Infinity,
                    maxPrice: -Infinity,
                    products: []
                };
            }

            const stats = categoryStats[category];
            stats.count++;
            stats.inStock += product.inStock ? 1 : 0;
            stats.outOfStock += product.inStock ? 0 : 1;
            stats.totalValue += product.price;
            stats.minPrice = Math.min(stats.minPrice, product.price);
            stats.maxPrice = Math.max(stats.maxPrice, product.price);
            stats.products.push({
                id: product.id,
                name: product.name,
                price: product.price,
                inStock: product.inStock
            });
        });

        // Calculate averages and format data
        Object.keys(categoryStats).forEach(category => {
            const stats = categoryStats[category];
            stats.averagePrice = parseFloat((stats.totalValue / stats.count).toFixed(2));
            stats.totalValue = parseFloat(stats.totalValue.toFixed(2));
            stats.stockPercentage = parseFloat(((stats.inStock / stats.count) * 100).toFixed(2));

            // Handle edge cases
            if (stats.minPrice === Infinity) stats.minPrice = 0;
            if (stats.maxPrice === -Infinity) stats.maxPrice = 0;
        });

        return categoryStats;
    }

    // Calculate pricing statistics
    static calculatePricingStats(products) {
        if (products.length === 0) {
            return {
                min: 0, max: 0, average: 0, median: 0,
                priceRanges: {}, distribution: []
            };
        }

        const prices = products.map(p => p.price).sort((a, b) => a - b);
        const totalValue = prices.reduce((sum, price) => sum + price, 0);

        // Basic stats
        const min = prices[0];
        const max = prices[prices.length - 1];
        const average = totalValue / prices.length;
        const median = prices.length % 2 === 0
            ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
            : prices[Math.floor(prices.length / 2)];

        // Price ranges
        const ranges = {
            'under-25': prices.filter(p => p < 25).length,
            '25-50': prices.filter(p => p >= 25 && p < 50).length,
            '50-100': prices.filter(p => p >= 50 && p < 100).length,
            '100-500': prices.filter(p => p >= 100 && p < 500).length,
            '500-1000': prices.filter(p => p >= 500 && p < 1000).length,
            'over-1000': prices.filter(p => p >= 1000).length
        };

        // Price distribution (quartiles)
        const q1Index = Math.floor(prices.length * 0.25);
        const q3Index = Math.floor(prices.length * 0.75);
        const q1 = prices[q1Index];
        const q3 = prices[q3Index];

        return {
            min: parseFloat(min.toFixed(2)),
            max: parseFloat(max.toFixed(2)),
            average: parseFloat(average.toFixed(2)),
            median: parseFloat(median.toFixed(2)),
            quartiles: {
                q1: parseFloat(q1.toFixed(2)),
                q3: parseFloat(q3.toFixed(2))
            },
            priceRanges: ranges,
            distribution: [
                { range: 'Q1 (0-25%)', min: min, max: q1, count: q1Index + 1 },
                { range: 'Q2 (25-50%)', min: q1, max: median, count: Math.floor(prices.length * 0.5) - q1Index },
                { range: 'Q3 (50-75%)', min: median, max: q3, count: q3Index - Math.floor(prices.length * 0.5) },
                { range: 'Q4 (75-100%)', min: q3, max: max, count: prices.length - q3Index }
            ]
        };
    }

    // Calculate inventory statistics
    static calculateInventoryStats(products) {
        const totalProducts = products.length;
        const inStockProducts = products.filter(p => p.inStock);
        const outOfStockProducts = products.filter(p => !p.inStock);

        // Most/least expensive in stock
        const inStockPrices = inStockProducts.map(p => p.price);
        const mostExpensiveInStock = inStockProducts.find(p => p.price === Math.max(...inStockPrices));
        const cheapestInStock = inStockProducts.find(p => p.price === Math.min(...inStockPrices));

        // Category inventory
        const categoryInventory = {};
        products.forEach(product => {
            if (!categoryInventory[product.category]) {
                categoryInventory[product.category] = { inStock: 0, outOfStock: 0, total: 0 };
            }
            categoryInventory[product.category].total++;
            if (product.inStock) {
                categoryInventory[product.category].inStock++;
            } else {
                categoryInventory[product.category].outOfStock++;
            }
        });

        return {
            totalProducts,
            inStockCount: inStockProducts.length,
            outOfStockCount: outOfStockProducts.length,
            stockPercentage: totalProducts > 0 ? parseFloat(((inStockProducts.length / totalProducts) * 100).toFixed(2)) : 0,
            mostExpensiveInStock: mostExpensiveInStock ? {
                id: mostExpensiveInStock.id,
                name: mostExpensiveInStock.name,
                price: mostExpensiveInStock.price,
                category: mostExpensiveInStock.category
            } : null,
            cheapestInStock: cheapestInStock ? {
                id: cheapestInStock.id,
                name: cheapestInStock.name,
                price: cheapestInStock.price,
                category: cheapestInStock.category
            } : null,
            byCategory: categoryInventory
        };
    }

    // Calculate trends (mock data since we don't have time series)
    static calculateTrends(products) {
        // Since we don't have historical data, we'll provide mock trends
        // In a real application, this would analyze time-series data

        const currentTime = new Date();
        const recentProducts = products.filter(p => {
            if (p.createdAt) {
                const createdDate = new Date(p.createdAt);
                const daysDiff = (currentTime - createdDate) / (1000 * 60 * 60 * 24);
                return daysDiff <= 30; // Products created in last 30 days
            }
            return false;
        });

        return {
            recentlyAdded: recentProducts.length,
            popularCategories: this.getPopularCategories(products),
            priceGrowth: {
                trend: 'stable', // Could be 'increasing', 'decreasing', 'stable'
                percentage: 0,
                period: '30 days'
            },
            inventoryTurnover: {
                rate: 'normal', // Could be 'high', 'normal', 'low'
                description: 'Based on stock levels and category distribution'
            }
        };
    }

    // Get popular categories by product count
    static getPopularCategories(products) {
        const categoryCounts = {};

        products.forEach(product => {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
        });

        return Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }));
    }
}

module.exports = StatsCalculator;