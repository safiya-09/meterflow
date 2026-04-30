const ApiKey = require('../models/apiKey.model');
const { checkRateLimit } = require('../services/rateLimit.service');

// @desc    Get current user's rate limit status
// @route   GET /api/rate-limit/me
// @access  Private
exports.getRateLimitStatus = async (req, res) => {
    try {
        // Find the user's active API keys
        const keys = await ApiKey.find({ userId: req.user.id, status: 'active' });

        if (!keys || keys.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    plan: "free",
                    limit: 100,
                    used: 0,
                    remaining: 100,
                    resetInSeconds: 0
                }
            });
        }

        // Return the status of the first active key (prioritizing higher plans)
        const planPriority = { 'enterprise': 3, 'pro': 2, 'free': 1 };
        const sortedKeys = [...keys].sort((a, b) => (planPriority[b.plan] || 0) - (planPriority[a.plan] || 0));
        
        const primaryKey = sortedKeys[0];
        
        // Use the checkRateLimit service - note: we call it here just to READ the value
        // but INCR will happen if we use the current checkRateLimit. 
        // I should probably add a getRateLimitStatus method to the service that doesn't INCR.
        
        const { redisClient, PLAN_LIMITS } = require('../config/redis');
        const { PLAN_LIMITS: LIMITS } = require('../services/rateLimit.service');
        const { redisClient: client } = require('../config/redis');
        
        const key = `ratelimit:${primaryKey._id}`;
        const limit = LIMITS[primaryKey.plan] || LIMITS.free;
        
        const currentUsageRaw = await client.get(key);
        const currentUsage = currentUsageRaw ? parseInt(currentUsageRaw) : 0;
        const ttl = await client.ttl(key);

        res.status(200).json({
            success: true,
            data: {
                plan: primaryKey.plan,
                limit,
                used: currentUsage,
                remaining: Math.max(0, limit - currentUsage),
                resetInSeconds: ttl < 0 ? 0 : ttl
            }
        });

    } catch (error) {
        console.error('Get Rate Limit Status Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
