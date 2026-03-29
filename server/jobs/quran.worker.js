import { Worker } from 'bullmq';
import redisClient from '../infrastructure/redis.js';
import bot from '../infrastructure/telegram.js';
import { handleGlobalError } from '../core/errorHandler.js';

export const quranWorker = new Worker('quran-tasks', async (job) => {
  const { chatId, message, keyboard } = job.data;
  
  // Pure business logic
  await bot.telegram.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });

}, { 
  connection: redisClient.options,
  limiter: { max: 30, duration: 1000 } // Global Rate Limit
});

// Centralized Listener for Worker Errors
quranWorker.on('failed', (job, err) => {
  handleGlobalError(err, `Worker Job: ${job.id}`);
});
