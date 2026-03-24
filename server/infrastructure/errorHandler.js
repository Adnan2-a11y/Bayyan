import logger from './logger.js';

/**
 * Global Error Handler
 * - Logs detailed error information
 * - Sends user-friendly error messages
 * - Handles both message and callback query contexts
 */
export const globalErrorHandler = (err, ctx) => {
  const userId = ctx.from?.id || 'Unknown';
  const updateType = ctx.updateType || 'Unknown';
  
  logger.error(`[GLOBAL ERROR] User ${userId} | Type: ${updateType}`);
  logger.error(`Message: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);

  // User-friendly message (don't leak internal errors)
  const friendlyMessage = "⚠️ System is recalibrating. Please try again in a moment.";
  
  // Handle callback queries (button clicks)
  if (ctx.callbackQuery) {
    return ctx.answerCbQuery(friendlyMessage, { show_alert: true }).catch(e => {
      logger.error(`Failed to send callback query error: ${e.message}`);
    });
  }
  
  // Handle regular messages
  return ctx.reply(friendlyMessage).catch(e => {
    logger.error(`Failed to send error reply: ${e.message}`);
  });
};

/**
 * AsyncHandler Middleware Wrapper
 * - Wraps async handlers to catch errors
 * - Prevents unhandled promise rejections
 * - Logs errors and handles gracefully
 */
export const asyncHandler = (fn) => {
  return async (ctx, next) => {
    try {
      return await fn(ctx, next);
    } catch (error) {
      // Log the error
      const userId = ctx.from?.id || 'Unknown';
      logger.error(`[HANDLER ERROR] User ${userId} | Handler: ${fn.name || 'Anonymous'}`);
      logger.error(`Error: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);

      // Send friendly error to user
      const friendlyMessage = "⚠️ Something went wrong. Please try again.";
      
      try {
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery(friendlyMessage, { show_alert: true });
        } else if (ctx.message) {
          await ctx.reply(friendlyMessage);
        }
      } catch (responseError) {
        logger.error(`Failed to send error response: ${responseError.message}`);
      }

      // Re-throw for bot.catch() to handle
      throw error;
    }
  };
};
