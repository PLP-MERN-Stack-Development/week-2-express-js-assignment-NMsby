// utils/performance.js - Performance monitoring utilities

class PerformanceMonitor {
    static measureExecutionTime(fn, context = 'operation') {
        return async (...args) => {
            const startTime = process.hrtime.bigint();
            const result = await fn(...args);
            const endTime = process.hrtime.bigint();
            const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

            console.log(`⚡ PERFORMANCE: ${context} took ${executionTime.toFixed(2)}ms`);

            return result;
        };
    }

    static memoryUsage() {
        const used = process.memoryUsage();
        return {
            rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
            heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
            heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
            external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
        };
    }

    static logResourceUsage(operation) {
        console.log(`📊 RESOURCE USAGE (${operation}):`);
        console.log('================================');
        console.log('Memory:', this.memoryUsage());
        console.log('Uptime:', `${Math.round(process.uptime())}s`);
        console.log('CPU Usage:', process.cpuUsage());
        console.log('================================\n');
    }
}

module.exports = PerformanceMonitor;