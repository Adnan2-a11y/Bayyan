import * as quranController from '../controllers/quranController.js';

export const setupActions = (bot) => {
  // Pattern: audio_surah_ayah
  bot.action(/^audio_(\d+)_(\d+)$/, quranController.handleAudioRequest);

  // Pattern: lang_code_surah_ayah
  bot.action(/^lang_([a-z]{2})_(\d+)_(\d+)$/, quranController.handleLanguageChange);
};
