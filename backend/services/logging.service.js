const UsageLog = require('../models/usageLog.model');

/**
 * Service to handle asynchronous API usage logging smoothly without penalizing proxy times
 */
class LoggingService {
    /**
     * Records API execution footprint.
     * @param {Object} logData - Information to log including telemetry metrics
     */
    static logUsage(logData) {
        // Fire and forget, no await. We do not block the gateway execution sequence.
        UsageLog.create(logData).catch((err) => {
            console.error('LoggingService Critical Error: Failed to log API usage:', err);
        });
    }
}

module.exports = LoggingService;
