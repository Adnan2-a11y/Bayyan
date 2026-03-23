import * as quranService from '../services/quranService.js';
import User from '../models/User.js';

export const handleReadAyah = async (ctx) => {
  try {
    const text = ctx.message.text.split(' ')[1]; // Expects "/read 2:255"
    if (!text) return ctx.reply("Please provide a reference, e.g., /read 2:255");

    const [surah, ayah] = text.split(':');
    const data = await quranService.fetchAyah(surah, ayah);

    // Update user's last read preferences in background
    await User.updateOne(
      { telegramId: ctx.from.id },
      { 'preferences.lastSurah': surah, 'preferences.lastAyah': ayah }
    );

    const message = `✨ *${data.surahName} (${surah}:${ayah})* ✨\n\n` +
                    `${data.arabic}\n\n` +
                    `📖 _${data.translation}_`;
    const keyboard = {
      inline_keyboard: [
        [
          { text: "▶️ Play Audio", callback_data: `audio_${surah}_${ayah}` }
        ],
        [
          { text: "🇧🇩 Bangla", callback_data: `lang_bn_${surah}_${ayah}` }
        ]
      ]
    };

    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: keyboard });

  } catch (error) {
    ctx.reply(error.message);
  }
};
// Handles when user clicks "Play Audio"
export const handleAudioRequest = async (ctx) => {
  const [_, surah, ayah] = ctx.match;
  const data = await quranService.fetchAyah(surah, ayah);
  await ctx.replyWithAudio(data.audioUrl);
  await ctx.answerCbQuery();
};

// Handles when user clicks "English" or "Bangla"
export const handleLanguageChange = async (ctx) => {
  const [_, lang, surah, ayah] = ctx.match;
  // Use editMessageText instead of reply to swap content in place
  await handleReadAyah(ctx, lang); 
  await ctx.answerCbQuery(`Language: ${lang}`);
};
