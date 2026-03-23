import 'dotenv/config';
import { Telegraf } from 'telegraf';
import connectDB from './infrastructure/db.js';
import logger from './infrastructure/logger.js';

import * as botController from './controllers/botController.js';
import * as quranController from './controllers/quranController.js';


connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);

// 1. ATTACH ERROR HANDLER FIRST
//bot.catch(globalErrorHandler);
// 3. Performance Middleware (Tracks API Latency)
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`⚡ Latency: ${ms}ms | User: ${ctx.from?.id}`);
});

// --- ROUTES / COMMANDS ---
bot.start(botController.handleStart);
bot.command('read', quranController.handleReadAyah);
// 3. Action Listeners (The Button Logic)
// Regex captures: audio_2_255 -> [2, 255]
bot.action(/^audio_(\d+)_(\d+)$/, quranController.handleAudioRequest);

// Regex captures: lang_en_2_255 -> [en, 2, 255]
bot.action(/^lang_([a-z]{2})_(\d+)_(\d+)$/, quranController.handleLanguageChange);
// 4. Global Error Catch
bot.catch((err, ctx) => {
  logger.error(`⚠️ Bot Error (${ctx.updateType}): ${err.message}`);
});

// 5. Launch & Graceful Shutdown
bot.launch()
  .then(() => logger.info('🚀 System Architect Bot: ONLINE'))
  .catch((err) => logger.error('FATAL: Bot Launch Failed: ' + err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
