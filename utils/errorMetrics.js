// utils/errorMetrics.js - Error metrics and monitoring

class ErrorMetrics {
    constructor() {
        this.metrics = {
            totalErrors: 0,
            errorsByType: {},
            errorsByStatusCode: {},
            errorsByEndpoint: {},
            errorsByTimeRange: {
                lastHour: [],
                lastDay: [],
                lastWeek: []
            }
        };
    }

    // Record an error occurrence
    recordError(error, req) {
        const now = new Date();
        const errorRecord = {
            timestamp: now.toISOString(),
            type: error.constructor.name,
            statusCode: error.statusCode || 500,
            message: error.message,
            endpoint: req ? `${req.method} ${req.originalUrl}` : 'unknown',
            userAgent: req ? req.get('User-Agent') : 'unknown',
            ip: req ? req.ip : 'unknown',
            requestId: req ? req.id : 'unknown'
        };

        // Update total count
        this.metrics.totalErrors++;

        // Update by type
        this.metrics.errorsByType[errorRecord.type] =
            (this.metrics.errorsByType[errorRecord.type] || 0) + 1;

        // Update by status code
        this.metrics.errorsByStatusCode[errorRecord.statusCode] =
            (this.metrics.errorsByStatusCode[errorRecord.statusCode] || 0) + 1;

        // Update by endpoint
        this.metrics.errorsByEndpoint[errorRecord.endpoint] =
            (this.metrics.errorsByEndpoint[errorRecord.endpoint] || 0) + 1;

        // Add to time-based tracking
        this.metrics.errorsByTimeRange.lastHour.push(errorRecord);
        this.metrics.errorsByTimeRange.lastDay.push(errorRecord);
        this.metrics.errorsByTimeRange.lastWeek.push(errorRecord);

        // Clean up old records
        this.cleanupOldRecords();

        return errorRecord;
    }

    // Clean up old error records
    cleanupOldRecords() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Filter out old records
        this.metrics.errorsByTimeRange.lastHour =
            this.metrics.errorsByTimeRange.lastHour.filter(
                record => new Date(record.timestamp) > oneHourAgo
            );

        this.metrics.errorsByTimeRange.lastDay =
            this.metrics.errorsByTimeRange.lastDay.filter(
                record => new Date(record.timestamp) > oneDayAgo
            );

        this.metrics.errorsByTimeRange.lastWeek =
            this.metrics.errorsByTimeRange.lastWeek.filter(
                record => new Date(record.timestamp) > oneWeekAgo
            );
    }

    // Get error statistics
    getStats() {
        return {
            summary: {
                totalErrors: this.metrics.totalErrors,
                errorsLastHour: this.metrics.errorsByTimeRange.lastHour.length,
                errorsLastDay: this.metrics.errorsByTimeRange.lastDay.length,
                errorsLastWeek: this.metrics.errorsByTimeRange.lastWeek.length
            },
            breakdown: {
                byType: this.metrics.errorsByType,
                byStatusCode: this.metrics.errorsByStatusCode,
                byEndpoint: this.metrics.errorsByEndpoint
            },
            recent: this.metrics.errorsByTimeRange.lastHour.slice(-10) // Last 10 errors
        };
    }

    // Get error rate for a time period
    getErrorRate(timeRange = 'lastHour') {
        const errors = this.metrics.errorsByTimeRange[timeRange] || [];
        const timeRangeMinutes = {
            lastHour: 60,
            lastDay: 1440,
            lastWeek: 10080
        };

        const minutes = timeRangeMinutes[timeRange] || 60;
        return errors.length / minutes; // errors per minute
    }

    // Check if error rate is above threshold
    isErrorRateHigh(threshold = 1.0, timeRange = 'lastHour') {
        return this.getErrorRate(timeRange) > threshold;
    }

    // Reset all metrics
    reset() {
        this.metrics = {
            totalErrors: 0,
            errorsByType: {},
            errorsByStatusCode: {},
            errorsByEndpoint: {},
            errorsByTimeRange: {
                lastHour: [],
                lastDay: [],
                lastWeek: []
            }
        };
    }
}

// Create singleton instance
const errorMetrics = new ErrorMetrics();

module.exports = {
    ErrorMetrics,
    errorMetrics
};