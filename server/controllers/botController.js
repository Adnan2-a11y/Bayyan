import * as userService from '../services/userServices.js';
import logger from '../infrastructure/logger.js';

export const handleStart = async (ctx) => {
  try {
    // 1. Service Call: Sync User with DB
    const user = await userService.syncUser(ctx.from);

    // 2. Formatting: Professional Welcome Message
    const welcomeMsg = 
      `Assalamu Alaikum, ${user.firstName || 'Brother/Sister'}! 🌙\n\n` +
      `Welcome to your **AI-Powered Islamic Assistant**.\n\n` +
      `📖 **Quran:** Search by Surah:Ayah (e.g., 2:255)\n` +
      `📜 **Hadith:** Ask about any topic (e.g., "patience")\n` +
      `🤖 **AI:** Ask questions about Islamic rulings or history.`;

    // 3. UI: Interactive Menu (Inline Keyboards)
    await ctx.reply(welcomeMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "📖 Read Last Ayah", callback_data: "read_last" }],
          [{ text: "📜 Search Hadith", callback_data: "hadith_search" }],
          [{ text: "⚙️ Settings", callback_data: "user_settings" }]
        ]
      }
    });

    logger.info(`User ${user.telegramId} initialized the bot.`);
  } catch (error) {
    logger.error(`Controller Error (handleStart): ${error.message}`);
    await ctx.reply("⚠️ Assalamu Alaikum. We are experiencing a temporary issue. Please try again shortly.");
  }
};
