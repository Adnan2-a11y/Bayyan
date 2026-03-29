import * as quranService from '../services/quranService.js';
import User from '../models/User.js';
import logger from '../infrastructure/logger.js';
import { catchAsync } from '../utils/catchAsync.js';
import { quranQueue } from '../jobs/quran.queue.js';

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
    const usageMessage = `✨ *Read a specific Ayah*\n\nTo read a specific Ayah, please use the format \`/read <Surah>:<Ayah>\`.\n\n_Example:_\n\`/read 2:255\` (Ayatul Kursi)\n\n*Don't remember the exact reference?*\nClick the button below to search for an Ayah.`;
    const usageKeyboard = {
      inline_keyboard: [[{ text: "🔍 Search Ayah", switch_inline_query_current_chat: "" }]]
    };

    if (!ctx.message || !ctx.message.text) {
      return ctx.reply(usageMessage, { parse_mode: 'Markdown', reply_markup: usageKeyboard });
    }

    const text = ctx.message.text.split(' ')[1]; // Expects "/read 2:255"
    if (!text) return ctx.reply(usageMessage, { parse_mode: 'Markdown', reply_markup: usageKeyboard });

    const [surah, ayah] = text.split(':');
    if (!surah || !ayah) {
      return ctx.reply(usageMessage, { parse_mode: 'Markdown', reply_markup: usageKeyboard });
    }

    const { message, keyboard } = await fetchAndFormatAyah(surah, ayah);

    // Update user's last read preferences in background (non-blocking)
    User.updateOne(
      { telegramId: ctx.from.id },
      { 'preferences.lastSurah': surah, 'preferences.lastAyah': ayah }
    ).catch(err => logger.warn(`Failed to update user preferences: ${err.message}`));

    await quranQueue.add('send-ayah', {
      type: 'SEND_MESSAGE',
      chatId: ctx.chat?.id || ctx.from?.id,
      message,
      keyboard
    });
  } catch (error) {
    logger.error(`Error in handleReadAyah: ${error.message}`);
    await ctx.reply(`⚠️ ${error.message || 'Failed to fetch Ayah. Please try again.'}`);
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

    await quranQueue.add('send-audio', {
      type: 'SEND_AUDIO',
      chatId: ctx.chat?.id || ctx.from?.id,
      audioUrl: data.audioUrl
    });
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

    // Queue the message edit
    await quranQueue.add('edit-language', {
      type: 'EDIT_MESSAGE',
      chatId: ctx.chat?.id || ctx.from?.id,
      messageId: ctx.callbackQuery?.message?.message_id,
      message,
      keyboard
    });

    await ctx.answerCbQuery(`✓ Language: ${lang.toUpperCase()}`);
  } catch (error) {
    logger.error(`Error in handleLanguageChange: ${error.message}`);
    await ctx.answerCbQuery(`⚠️ ${error.message || 'Failed to change language. Try again.'}`, { show_alert: true });
  }
};


export const handleInlineQuery = async (ctx) => {
  const query = ctx.inlineQuery.query;
  if (query.length < 3) return;

  const results = await quranService.searchAyah(query);

  const telegramResults = results.map(res => ({
    type: 'article',
    id: res.id,
    title: res.title,
    description: res.translation,
    input_message_content: {
      message_text: `📖 *${res.title}*\n\n${res.text}\n\n_${res.translation}_`,
      parse_mode: 'Markdown'
    }
  }));

  await ctx.answerInlineQuery(telegramResults);
};

// HELPER: The "Renderer" that builds the message and buttons
const renderSurahPage = async (surahId, offset = 0, lang = 'en') => {
  const data = await quranService.fetchFullSurah(surahId, lang);
  const limit = 5;
  const total = data.total_verses;
  const verses = data.verses.slice(offset, offset + limit);

  // 1. Build Header with Audio Link (Reciter 1)
  const audioUrl = data.audio['1']?.url || '';
  let message = `📖 *Surah ${data.transliteration}* (${data.translation})\n`;
  if (audioUrl) message += `🔊 [Listen to Full Surah](${audioUrl})\n`;
  message += `✨ Verses: ${total} | Language: ${lang.toUpperCase()}\n\n`;

  // 2. Format Verse List
  const versesText = verses.map(v =>
    `🔹 *${v.id}.* ${v.text}\n📖 _${v.translation}_`
  ).join('\n\n');

  // 3. Build Intelligent Keyboard
  const navRow = [];
  if (offset > 0)
    navRow.push({ text: "⬅️ Back", callback_data: `s_pg:${surahId}:${offset - limit}:${lang}` });
  if (offset + limit < total)
    navRow.push({ text: "Next ➡️", callback_data: `s_pg:${surahId}:${offset + limit}:${lang}` });

  const langRow = [
    { text: "🇧🇩 Bangla", callback_data: `s_pg:${surahId}:${offset}:bn` },
    { text: "🇬🇧 English", callback_data: `s_pg:${surahId}:${offset}:en` }
  ];

  return {
    text: `${message}${versesText}`,
    keyboard: { inline_keyboard: [navRow, langRow] }
  };
};

// 1. Initial Command Handler (/surah 1)
export const handleFullSurah = async (ctx) => {
  try {
    const usageMessage = `📖 *Read the Holy Quran*\n\nTo read a complete Surah, type \`/surah\` followed by its number (1-114).\n\n_Example:_\n\`/surah 1\` (Al-Fatiha)\n\n*Or quickly search by name:*\nClick the button below to find a Surah instantly.`;
    const usageKeyboard = {
      inline_keyboard: [[{ text: "🔍 Search Surah", switch_inline_query_current_chat: "" }]]
    };

    const surahId = ctx.message.text.split(' ')[1];
    if (!surahId || isNaN(surahId) || surahId < 1 || surahId > 114) {
      return ctx.reply(usageMessage, { parse_mode: 'Markdown', reply_markup: usageKeyboard });
    }

    const { text, keyboard } = await renderSurahPage(surahId, 0, 'en');
    await quranQueue.add('send-surah', {
      type: 'SEND_MESSAGE',
      chatId: ctx.chat?.id || ctx.from?.id,
      message: text,
      keyboard
    });
  } catch (error) {
    logger.error(`Surah Cmd Error: ${error.message}`);
    ctx.reply("⚠️ Could not load Surah. Please check the ID (1-114).");
  }
};

// 2. Action Handler (Pagination & Language Switch)
export const handleSurahPagination = async (ctx) => {
  try {
    // Regex capture groups: 1=surahId, 2=offset, 3=lang
    const [_, surahId, offset, lang] = ctx.match;
    
    const { text, keyboard } = await renderSurahPage(surahId, parseInt(offset), lang);

    await quranQueue.add('edit-surah', {
      type: 'EDIT_MESSAGE',
      chatId: ctx.chat?.id || ctx.from?.id,
      messageId: ctx.callbackQuery?.message?.message_id,
      message: text,
      keyboard
    });
    await ctx.answerCbQuery();
  } catch (error) {
    logger.error(`Surah Action Error: ${error.message}`);
    await ctx.answerCbQuery("⚠️ Error loading page", { show_alert: true });
  }
};