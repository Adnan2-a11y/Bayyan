import axios from 'axios';
import logger from '../infrastructure/logger.js';

const BASE_URL = 'https://alquran-api.pages.dev/api/quran';

/*export const fetchAyah = async (surahId, verseId, lang = 'en') => {
  try {
    // Documentation Endpoint: /surah/{surah_id}/verse/{verse_id}
    const response = await axios.get(`${BASE_URL}/surah/${surahId}/verse/${verseId}`, {
      params: { lang }
    });
    console.log('',response.data);

    const { surah, verse } = response.data;

    return {
      arabic: verse.text,
      translation: verse.translation,
      surahName: surah.transliteration,
      ayahNumber: verse.id
    };
  } catch (error) {
    logger.error(`Quran API Error: ${error.message} | Path: /surah/${surahId}/verse/${verseId}`);
    throw new Error("I couldn't find that specific Ayah. Please ensure the Surah (1-114) and Ayah numbers are correct.");
  }
};*/
export const fetchAyah = async (surahId, verseId, lang = 'en') => {
  try {
    const response = await axios.get(`${BASE_URL}/surah/${surahId}/verse/${verseId}`, {
      params: { lang }
    });

    const { surah, verse, audio } = response.data;

    return {
      arabic: verse.text,
      translation: verse.translation,
      surahName: surah.transliteration, // FIXED: Now matches API response
      ayahNumber: verse.id,
      audioUrl: audio['1'].url // NEW: Defaulting to reciter 1
    };
  } catch (error) {
    logger.error(`Quran API Error: ${error.message}`);
    throw new Error("Ayah not found.");
  }
};
