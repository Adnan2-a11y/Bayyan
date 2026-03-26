import mongoose from 'mongoose';

const VerseSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  text: { type: String, required: true }, // Arabic text
  translation: { type: String, required: true }
});

const AudioSchema = new mongoose.Schema({
  reciter: String,
  url: String,
  originalUrl: String,
  type: { type: String, default: 'complete_surah' }
});

const SurahSchema = new mongoose.Schema({
  id: { type: Number, required: true }, // Surah Number (1-114)
  language: { type: String, required: true, enum: ['en', 'bn', 'ar'], default: 'en' },
  name: { type: String, required: true }, // Arabic name
  transliteration: { type: String, required: true },
  translation: { type: String, required: true },
  type: { type: String, enum: ['meccan', 'medinan'] },
  total_verses: { type: Number, required: true },
  
  // Audio Map: Allows access like surah.audio['1']
  audio: {
    type: Map,
    of: AudioSchema
  },

  // Embedded Array: Best for bounded data (max 286 verses)
  verses: [VerseSchema],

  // Metadata for System Design
  createdAt: { type: Date, default: Date.now }
}, { 
  timestamps: true // Automatically manages updatedAt
});

// CRITICAL: Compound Index for fast lookups
SurahSchema.index({ id: 1, language: 1 }, { unique: true });

export default mongoose.model('Surah', SurahSchema);
