const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) =>
    console.error('❌ Redis Error:', err.message)
);

redisClient.on('connect', () =>
    console.log('✅ Redis Connected')
);

const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (error) {
        console.error('Redis Connection Failed:', error.message);
    }
};

module.exports = { redisClient, connectRedis };