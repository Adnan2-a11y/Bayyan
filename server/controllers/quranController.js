import * as quranService from '../services/quranService.js';
import User from '../models/User.js';
import logger from '../infrastructure/logger.js';

// Core Helper: Fetch and Format Ayah (Reusable Logic)
const fetchAndFormatAyah = async (surah, ayah, lang = 'en') => {
  const data = await quranService.fetchAyah(surah, ayah, lang);
  const message = `✨ *${data.surahName} (${surah}:${ayah})* ✨\n\n` +
                  `${data.arabic}\n\n` +
                  `📖 _${data.translation}_`;
  const keyboard = {
    inline_keyboard: [
      [
        { text: "▶️ Play Audio", callback_data: `audio_${surah}_${ayah}` }
      ],
      [
        { text: "🇧🇩 Bangla", callback_data: `lang_bn_${surah}_${ayah}` },
        { text: "🇬🇧 English", callback_data: `lang_en_${surah}_${ayah}` }
      ]
    ]
  };
  return { message, keyboard };
};

export const handleReadAyah = async (ctx) => {
  try {
    if (!ctx.message || !ctx.message.text) {
      return ctx.reply("⚠️ Invalid message format. Please use /read 2:255");
    }

    const text = ctx.message.text.split(' ')[1]; // Expects "/read 2:255"
    if (!text) return ctx.reply("Please provide a reference, e.g., /read 2:255");

    const [surah, ayah] = text.split(':');
    if (!surah || !ayah) {
      return ctx.reply("⚠️ Invalid format. Use: /read 2:255");
    }

    const { message, keyboard } = await fetchAndFormatAyah(surah, ayah);

    // Update user's last read preferences in background (non-blocking)
    User.updateOne(
      { telegramId: ctx.from.id },
      { 'preferences.lastSurah': surah, 'preferences.lastAyah': ayah }
    ).catch(err => logger.warn(`Failed to update user preferences: ${err.message}`));

    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (error) {
    logger.error(`Error in handleReadAyah: ${error.message}`);
    await ctx.reply(`⚠️ ${error.message || 'Failed to fetch Ayah. Please try again.'}`);
  }
};

export const handleFullSurah = async (ctx) => {
  try {
    const surahId = ctx.message.text.split(' ')[1]; // "/surah 1"
    if (!surahId || surahId < 1 || surahId > 114) return ctx.reply("Usage: /surah [1-114]");

    const data = await quranService.fetchFullSurah(surahId);

    // Header Message
    const header = `📖 *Surah ${data.transliteration}* (${data.translation})\n` +
                   `✨ Type: ${data.type} | Verses: ${data.total_verses}\n\n` +
                   `_Showing Verses 1-10:_`;

    // Format first 10 verses
    const versesText = data.verses.slice(0, 10).map(v => 
      `🔹 *${v.id}.* ${v.text}\n📖 _${v.translation}_`
    ).join('\n\n');

    const keyboard = {
      inline_keyboard: [
        [
          { text: "Next 10 ➡️", callback_data: `surah_page_${surahId}_10` }
        ]
      ]
    };

    await ctx.reply(`${header}\n\n${versesText}`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    ctx.reply(error.message);
  }
};


// Handles when user clicks "Play Audio"
export const handleAudioRequest = async (ctx) => {
  try {
    if (!ctx.match || !ctx.match[1] || !ctx.match[2]) {
      throw new Error('Invalid audio request format');
    }

    const [_, surah, ayah] = ctx.match;
    const data = await quranService.fetchAyah(surah, ayah);

    if (!data.audioUrl) {
      return ctx.answerCbQuery('⚠️ Audio not available for this verse', { show_alert: true });
    }

    await ctx.replyWithAudio(data.audioUrl);
    await ctx.answerCbQuery();
  } catch (error) {
    logger.error(`Error in handleAudioRequest: ${error.message}`);
    await ctx.answerCbQuery('⚠️ Failed to load audio. Please try again.', { show_alert: true });
  }
};

// Handles when user clicks "English" or "Bangla"
export const handleLanguageChange = async (ctx) => {
  try {
    if (!ctx.match || !ctx.match[1] || !ctx.match[2] || !ctx.match[3]) {
      throw new Error('Invalid language change format');
    }

    const [_, lang, surah, ayah] = ctx.match;

    // Validate language code
    if (!['en', 'bn', 'ar'].includes(lang)) {
      return ctx.answerCbQuery('⚠️ Language not supported', { show_alert: true });
    }

    const { message, keyboard } = await fetchAndFormatAyah(surah, ayah, lang);

    // Update user's language preference
    User.updateOne(
      { telegramId: ctx.from.id },
      { 'preferences.language': lang }
    ).catch(err => logger.warn(`Failed to update user language: ${err.message}`));

    // Edit the existing message instead of sending new one
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    await ctx.answerCbQuery(`✓ Language: ${lang.toUpperCase()}`);
  } catch (error) {
    logger.error(`Error in handleLanguageChange: ${error.message}`);
    await ctx.answerCbQuery(`⚠️ ${error.message || 'Failed to change language. Try again.'}`, { show_alert: true });
  }
};

export const handleSurahPagination = async (ctx) => {
  const [_, __, surahId, offset] = ctx.match; // e.g., surah_page_1_10
  const start = parseInt(offset);
  const end = start + 10;

  const data = await quranService.fetchFullSurah(surahId);
  const total = data.total_verses;

  const versesText = data.verses.slice(start, end).map(v => 
    `🔹 *${v.id}.* ${v.text}\n📖 _${v.translation}_`
  ).join('\n\n');

  const buttons = [];
  if (start > 0) buttons.push({ text: "⬅️ Back", callback_data: `surah_page_${surahId}_${start - 10}` });
  if (end < total) buttons.push({ text: "Next ➡️", callback_data: `surah_page_${surahId}_${end}` });

  await ctx.editMessageText(`📖 *Surah ${data.transliteration}* (Verses ${start+1}-${Math.min(end, total)})\n\n${versesText}`, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [buttons] }
  });
};
