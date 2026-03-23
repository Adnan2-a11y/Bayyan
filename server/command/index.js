import * as botController from '../controllers/botController.js';
import * as quranController from '../controllers/quranController.js';

export const setupCommands = (bot) => {
  bot.start(botController.handleStart);
  bot.command('read', quranController.handleReadAyah);
};
