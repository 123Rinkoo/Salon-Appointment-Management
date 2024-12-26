const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379', 
});

redisClient.on('connect', () => {
    console.log('Connected to Redis successfully!');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});

(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('Failed to connect to Redis:', error.message);
    }
})();


module.exports = redisClient;
