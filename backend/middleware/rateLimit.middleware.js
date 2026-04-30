const { checkRateLimit } = require('../services/rateLimit.service');

/**
 * Middleware to enforce rate limiting based on the API Key's plan.
 * expects req.apiKeyDoc to be populated by a preceding middleware.
 */
const rateLimitMiddleware = async (req, res, next) => {
    // If no API Key doc is found, we can't rate limit by key
    // Usually this means the request is already unauthorized, but let's be safe.
    if (!req.apiKeyDoc) {
        return next();
    }

    try {
        const { allowed, limit, used, remaining, resetInSeconds } = await checkRateLimit(
            req.apiKeyDoc._id,
            req.apiKeyDoc.plan || 'free'
        );

        // Required Headers
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', resetInSeconds);

        if (!allowed) {
            return res.status(429).json({
                success: false,
                message: "Rate limit exceeded"
            });
        }

        next();
    } catch (error) {
        console.error('Rate Limit Middleware Error:', error);
        // If Redis is down, we might want to allow the request to not break the service
        // but the prompt implies strict enforcement. For now, we'll return 500.
        return res.status(500).json({ success: false, message: 'Rate limiting service unavailable' });
    }
};

module.exports = rateLimitMiddleware;
