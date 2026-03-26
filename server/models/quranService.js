import axios from 'axios';
import logger from '../infrastructure/logger.js';
import redisClient from '../infrastructure/redis.js';
import Surah from '../models/Surah.js';

const BASE_URL = 'https://alquran-api.pages.dev/api/quran';

export const fetchAyah = async (surahId, verseId, lang = 'en') => {
  try {
    const response = await axios.get(`${BASE_URL}/surah/${surahId}/verse/${verseId}`, {
      params: { lang }
    });
    //console.log('Ayah Response:', response.data);
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

// Fetch an entire Surah (114 verses at once)
export const fetchFullSurah = async (surahId, lang = 'en') => {
  const cacheKey = `quran:surah:${surahId}:${lang}`;

  // 1. Level 1: REDIS (Speed)
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 2. Level 2: MONGODB (Persistence)
  let surahData = await Surah.findOne({ id: surahId, language: lang });

  if (!surahData) {
    // 3. Level 3: API (Last Resort)
    const response = await axios.get(`${BASE_URL}/surah/${surahId}`, { params: { lang } });
    surahData = response.data;
    
    // Save to MongoDB for the future
    await Surah.create(surahData).catch(err => console.error("DB Save Error:", err));
  }

  // Sync back to Redis for next time (Expire in 24h)
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
