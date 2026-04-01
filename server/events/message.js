import logger from '../infrastructure/logger.js';

export const event = 'message';
export const handler = async (ctx) => {
  try {
    await ctx.reply(
      "👋 Welcome! Use /read to search Quran (e.g., /read 2:255)\n" +
      "For more features, click /start"
    );
  } catch (err) {
    logger.error(`Error in fallback message handler: ${err.message}`);
  }
};
