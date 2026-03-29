import 'dotenv/config';
import redisClient from './infrastructure/redis.js';
console.log("Redis Options:", JSON.stringify(redisClient.options, null, 2));
