import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  query: String, // What the user asked
  responseType: { type: String, enum: ['quran', 'hadith', 'general'], default: 'general' },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('History', historySchema);
