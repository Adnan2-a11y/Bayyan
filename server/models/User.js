import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: { 
  type: String, 
  unique: true, 
  sparse: true 
},
  firstName: String,
  preferences: {
    language: { type: String, default: 'en' }, // 'ar', 'bn', 'en'
    lastSurah: { type: Number, default: 1 },
    lastAyah: { type: Number, default: 1 }
  },
  isPremium: { type: Boolean, default: false }, // For your Agency/Freelance model
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ telegramId: 1 },{unique: true}); // Ensure fast lookups by Telegram ID
export default mongoose.model('User', userSchema);
