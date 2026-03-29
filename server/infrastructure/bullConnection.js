import IORedis from 'ioredis';
import logger from './logger.js';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.error('❌ BullMQ: REDIS_URL not found in environment');
}

/**
 * Shared IORedis connection tailored for BullMQ.
 * BullMQ requires maxRetriesPerRequest to be null or a specific setting.
 * We use a factory-like object or a single instance depending on needs.
 */
const bullConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  // Enable keepAlive for long-running worker connections
  keepAlive: 30000,
});

bullConnection.on('error', (err) => {
  logger.error(`🔴 BullMQ Redis Connection Error: ${err.message}`);
});

bullConnection.on('connect', () => {
  logger.info('✅ BullMQ Redis: Connected');
});

export default bullConnection;
