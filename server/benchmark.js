import http from 'http';
import * as quranService from './services/quranService.js';
import connectDB from './infrastructure/db.js';
import { connectRedis } from './infrastructure/redis.js';

// Connect to your infrastructure first
await connectDB();
await connectRedis();

const server = http.createServer(async (req, res) => {
  try {
    // This simulates exactly what happens when a user requests a Surah
    await quranService.fetchFullSurah(1, 'en'); 
    res.end('ok');
  } catch (err) {
    res.statusCode = 500;
    res.end('error');
  }
});

server.listen(3000, () => {
  console.log('🚀 Benchmarking server active on port 3000');
});
