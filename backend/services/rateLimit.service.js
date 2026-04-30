const { redisClient } = require('../config/redis');

const PLAN_LIMITS = {
    free: 100,
    pro: 1000,
    growth: 10000,
    enterprise: 100000
};

const WINDOW_SIZE_IN_SECONDS = 3600; // 1 hour

/**
 * Checks and updates the rate limit for a specific API Key.
 * Uses Redis atomic logic (INCR, EXPIRE, TTL).
 * 
 * @param {string} apiKeyId - The ID of the API Key.
 * @param {string} plan - The plan associated with the API Key (free, pro, enterprise).
 * @returns {Promise<Object>} - Rate limit status.
 */
const checkRateLimit = async (apiKeyId, plan = 'free') => {
    const key = `ratelimit:${apiKeyId}`;
    const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Increment the counter
    const currentUsage = await redisClient.incr(key);
    
    // Set expiration only on the first request in the window
    if (currentUsage === 1) {
        await redisClient.expire(key, WINDOW_SIZE_IN_SECONDS);
    }

    // Get remaining time until reset
    const ttl = await redisClient.ttl(key);

    return {
        allowed: currentUsage <= limit,
        limit,
        used: currentUsage,
        remaining: Math.max(0, limit - currentUsage),
        resetInSeconds: ttl < 0 ? 0 : ttl
    };
};

module.exports = {
    checkRateLimit,
    PLAN_LIMITS
};
