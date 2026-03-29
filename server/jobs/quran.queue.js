import { Queue } from 'bullmq';
import redisClient from '../infrastructure/redis.js';

export const quranQueue = new Queue('quran-tasks', {
  connection: redisClient.options,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true, // Crucial for 100k users to save Redis memory
    removeOnFail: { age: 24 * 3600 } // Keep failed jobs for 24h for debugging
  }
});
