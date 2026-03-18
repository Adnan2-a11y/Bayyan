import logger from '../infrastructure/logger.js';

export const globalErrorHandler = (err, ctx) => {
  const userId = ctx.from?.id || 'Unknown';
  logger.error(`[Global Error] User ${userId} | ${err.stack}`);

  // Professional touch: Don't leak system errors to users
  const friendlyMessage = "⚠️ System is recalibrating. Please try again in a moment.";
  
  // Check if it's a callback query or a message
  if (ctx.callbackQuery) {
    return ctx.answerCbQuery(friendlyMessage, { show_alert: true });
  }
  return ctx.reply(friendlyMessage);
};
