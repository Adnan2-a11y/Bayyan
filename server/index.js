import 'dotenv/config';
import { Telegraf } from 'telegraf';
import connectDB from './infrastructure/db.js';
import logger from './infrastructure/logger.js';
import { asyncHandler } from './infrastructure/errorHandler.js';
import { connectRedis } from './infrastructure/redis.js';

import bot from './infrastructure/telegram.js';
import * as botController from './controllers/botController.js';
import * as quranController from './controllers/quranController.js';
import './jobs/quran.worker.js';


connectDB();
await connectRedis();

// Removed local bot initialization (now imported from infrastructure)

// ========== MIDDLEWARE STACK ==========

// 1. Error Handler Middleware (ATTACH FIRST - before any handlers)
bot.catch((err, ctx) => {
  logger.error(`🔴 Unhandled Bot Error (${ctx.updateType}): ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  
  const friendlyMessage = "⚠️ System is recalibrating. Please try again in a moment.";
  
  if (ctx.callbackQuery) {
    return ctx.answerCbQuery(friendlyMessage, { show_alert: true }).catch(e => {
      logger.error(`Failed to send error callback query: ${e.message}`);
    });
  }
  return ctx.reply(friendlyMessage).catch(e => {
    logger.error(`Failed to send error message: ${e.message}`);
  });
});

// 2. Performance & Logging Middleware
bot.use(async (ctx, next) => {
  const start = Date.now();
  try {
    await next();
  } catch (err) {
    // Re-throw to bot.catch()
    throw err;
  }
  const ms = Date.now() - start;
  logger.info(`⚡ Latency: ${ms}ms | Update: ${ctx.updateType} | User: ${ctx.from?.id}`);
});

// ========== COMMAND HANDLERS ==========
bot.start(asyncHandler(botController.handleStart));
bot.command('read', asyncHandler(quranController.handleReadAyah));
bot.command('surah', asyncHandler(quranController.handleFullSurah)); // NEW

// ========== AUTO-SUGGESTION (INLINE MODE) ==========
bot.on('inline_query', asyncHandler(quranController.handleInlineQuery));
// ========== ACTION HANDLERS (BUTTON CLICKS) ==========
// Regex captures: audio_2_255 -> [2, 255]
bot.action(/^audio_(\d+)_(\d+)$/, asyncHandler(quranController.handleAudioRequest));

// Regex captures: lang_en_2_255 -> [en, 2, 255]
bot.action(/^lang_([a-z]{2})_(\d+)_(\d+)$/, asyncHandler(quranController.handleLanguageChange));

// Add this inside the "ACTION HANDLERS" section of index.js
bot.action(/^s_pg:(\d+):(\d+):([a-z]{2})$/, asyncHandler(quranController.handleSurahPagination));

// ========== FALLBACK HANDLER ==========
bot.on('message', async (ctx) => {
  try {
    await ctx.reply(
      "👋 Welcome! Use /read to search Quran (e.g., /read 2:255)\n" +
      "For more features, click /start"
    );
  } catch (err) {
    logger.error(`Error in fallback message handler: ${err.message}`);
  }
});

// ========== LAUNCHER & GRACEFUL SHUTDOWN ==========
bot.launch()
  .then(() => {
    logger.info('✅ 🚀 Bayyan Bot: ONLINE & OPERATIONAL');
    logger.info('✓ Database connected');
    logger.info('✓ Global error handling active');
    logger.info('✓ All handlers wrapped with error protection');
  })
  .catch((err) => {
    logger.error('❌ FATAL: Bot Launch Failed');
    logger.error(`Error: ${err.message}`);
    logger.error(`Stack: ${err.stack}`);
    process.exit(1);
  });

// ========== PROCESS-LEVEL ERROR HANDLING ==========
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🔴 Unhandled Rejection:', reason);
  logger.error(`Promise: ${promise}`);
});

process.on('uncaughtException', (error) => {
  logger.error('🔴 Uncaught Exception:', error);
  logger.error(`Stack: ${error.stack}`);
  // Note: Process should exit after uncaught exception
  console.error('Fatal error. Exiting gracefully...');
  bot.stop('uncaughtException');
  process.exit(1);
});

process.once('SIGINT', () => {
  logger.info('📴 SIGINT received. Shutting down gracefully...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  logger.info('📴 SIGTERM received. Shutting down gracefully...');
  bot.stop('SIGTERM');
  process.exit(0);
});
