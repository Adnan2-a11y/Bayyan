import { Worker } from 'bullmq';
import bullConnection from '../infrastructure/bullConnection.js';
import bot from '../infrastructure/telegram.js';
import { handleGlobalError } from '../core/errorHandler.js';
import logger from '../infrastructure/logger.js';

export const quranWorker = new Worker('quran-tasks', async (job) => {
  const { type, chatId, message, keyboard, audioUrl, messageId } = job.data;
  
  logger.info(`🔄 Job Start [${job.id}]: ${type}`);

  try {
    if (type === 'SEND_MESSAGE') {
      await bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...(keyboard && { reply_markup: keyboard })
      });
    } else if (type === 'EDIT_MESSAGE') {
      await bot.telegram.editMessageText(chatId, messageId, undefined, message, {
        parse_mode: 'Markdown',
        ...(keyboard && { reply_markup: keyboard })
      });
    } else if (type === 'SEND_AUDIO') {
      await bot.telegram.sendAudio(chatId, audioUrl);
    }
    
    logger.info(`✅ Job Complete [${job.id}]: ${type}`);
  } catch (error) {
    logger.error(`❌ Job Failed [${job.id}]: ${error.message}`);
    throw error; // Re-throw to trigger BullMQ retry
  }

}, { 
  connection: bullConnection,
  limiter: { max: 30, duration: 1000 } // Global Rate Limit
});

logger.info('🚀 Quran Worker Initialized & Listening');

// Centralized Listener for Worker Errors
quranWorker.on('failed', (job, err) => {
  handleGlobalError(err, `Worker Job: ${job.id}`);
});
