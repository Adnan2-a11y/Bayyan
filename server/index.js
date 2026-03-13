import 'dotenv/config';
import { Telegraf } from 'telegraf';
import connectDB from './infrastructure/db.js';
import logger from './infrastructure/logger.js';

connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);

// 3. Performance Middleware (Tracks API Latency)
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`⚡ Latency: ${ms}ms | User: ${ctx.from?.id}`);
});

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
