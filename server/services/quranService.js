import axios from 'axios';
import logger from '../infrastructure/logger.js';
import redisClient from '../infrastructure/redis.js';
import Surah from '../models/Surah.js';

const BASE_URL = 'https://alquran-api.pages.dev/api/quran';

// Static mapping of verses in each of the 114 Surahs
const SURAH_LENGTHS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
  89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
  30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

export const fetchAyah = async (surahId, verseId, lang = 'en') => {
  try {
    const response = await axios.get(`${BASE_URL}/surah/${surahId}/verse/${verseId}`, {
      params: { lang }
    });
    //console.log('Ayah Response:', response.data);
    const { surah, verse, audio } = response.data;

    return {
      surahId: parseInt(surahId), // NEW: Ensure ID is returned for downstream logic
      arabic: verse.text,
      translation: verse.translation,
      surahName: surah.transliteration,
      ayahNumber: verse.id,
      audioUrl: audio['1'].url
    };
  } catch (error) {
    logger.error(`Quran API Error: ${error.message}`);
    throw new Error("Ayah not found.");
  }
};

// Fetch an entire Surah (114 verses at once)
export const fetchFullSurah = async (surahId, lang = 'en') => {
  const cacheKey = `quran:surah:${surahId}:${lang}`;

  // 1. Level 1: Check Redis (Cache)
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 2. Level 2: Check MongoDB (Persistence)
  let surahData = await Surah.findOne({ id: surahId, language: lang });

  if (!surahData) {
    // 3. Level 3: Fetch API (First time only)
    const response = await axios.get(`${BASE_URL}/surah/${surahId}`, { params: { lang } });
    const apiData = response.data;
    // Transform API response to match Surah schema
    surahData = {
      id: apiData.id,
      language: lang,
      name: apiData.name,
      transliteration: apiData.transliteration,
      translation: apiData.translation,
      type: apiData.type,
      total_verses: apiData.total_verses,
      audio: apiData.audio, // Ensure this is a Map of AudioSchema objects
      verses: Array.isArray(apiData.verses) ? apiData.verses.map(v => ({
        id: v.id,
        text: v.text,
        translation: v.translation
      })) : [],
    };

    // Save to Database so we never call API for this again
    await Surah.create(surahData).catch(err => logger.error("DB Save Error:", err));
  }

  // Sync to Redis for fast future access
  await redisClient.setEx(cacheKey, 86400, JSON.stringify(surahData));
  return surahData;
};
export const searchAyah = async (query) => {
  const response = await axios.get(`https://alquran-api.pages.dev`, {
    params: { q: query }
  });
  
  // Return a generic array of results
  return response.data.results.slice(0, 8).map(res => ({
    id: `${res.surah.id}:${res.verses.id}`,
    title: `${res.surah.transliteration} ${res.surah.id}:${res.verses.id}`,
    text: res.verses.text,
    translation: res.verses.translation
  }));
};

/**
 * Get a random Ayah from the Quran
 * @param {string} lang - Language code ('en', 'bn', 'ar')
 * @returns {Promise<Object>} Ayah data
 */
export const getRandomAyah = async (lang = 'en') => {
  const surahId = Math.floor(Math.random() * 114) + 1;
  const totalVerses = SURAH_LENGTHS[surahId - 1];
  const verseId = Math.floor(Math.random() * totalVerses) + 1;
  
  logger.info(`🎲 Fetching Random Ayah: ${surahId}:${verseId} (${lang})`);
  const data = await fetchAyah(surahId, verseId, lang);
  return { ...data, surahId }; // Explicitly ensure surahId is present
};
