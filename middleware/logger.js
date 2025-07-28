// middleware/logger.js - Custom logging middleware

const logger = (req, res, next) => {
    // Get current timestamp
    const timestamp = new Date().toISOString();

    // Get client IP address
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown';

    // Get user agent
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Create log entry
    const logEntry = {
        timestamp,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: clientIP,
        userAgent: userAgent.substring(0, 100), // Limit user agent length
        query: Object.keys(req.query).length > 0 ? req.query : null,
        body: req.method === 'POST' || req.method === 'PUT' ? req.body : null
    };

    // Console log with colors for better visibility
    console.log('\n📝 REQUEST LOG:');
    console.log('================');
    console.log(`🕐 Timestamp: ${timestamp}`);
    console.log(`🔗 ${req.method} ${req.originalUrl || req.url}`);
    console.log(`🌐 IP: ${clientIP}`);
    console.log(`📱 User-Agent: ${userAgent.substring(0, 50)}...`);

    if (Object.keys(req.query).length > 0) {
        console.log(`❓ Query Params:`, req.query);
    }

    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
        console.log(`📦 Request Body:`, req.body);
    }

    console.log('================\n');

    // Store start time for response time calculation
    req.startTime = Date.now();

    // Override res.end to log response details
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        // Calculate response time
        const responseTime = Date.now() - req.startTime;

        console.log('📤 RESPONSE LOG:');
        console.log('================');
        console.log(`🔗 ${req.method} ${req.originalUrl || req.url}`);
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`⏱️  Response Time: ${responseTime}ms`);
        console.log('================\n');

        originalEnd.call(res, chunk, encoding);
    };

    next();
};

module.exports = logger;