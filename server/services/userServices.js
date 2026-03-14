import User from '../models/User.js';
import logger from '../infrastructure/logger.js';

export const syncUser = async (tgUser) => {
  try {
    // Upsert: Create if doesn't exist, update if it does
    const user = await User.findOneAndUpdate(
      { telegramId: tgUser.id },
      { 
        username: tgUser.username, 
        firstName: tgUser.first_name 
      },
      { upsert: true, new: true }
    );
    return user;
  } catch (error) {
    logger.error(`Service Error (syncUser): ${error.message}`);
    throw error;
  }
};
