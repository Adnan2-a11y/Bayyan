import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import logger from '../infrastructure/logger.js';

export const setupCommands = async (bot) => {
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const files = fs.readdirSync(currentDir).filter(file => file.endsWith('.js') && file !== 'index.js');

  for (const file of files) {
    try {
      const modulePath = pathToFileURL(path.join(currentDir, file)).href;
      const { name, handler } = await import(modulePath);

      if (!name || !handler) {
        logger.warn(`Skipping command ${file}: Missing 'name' or 'handler' export.`);
        continue;
      }

      if (name === 'start') {
        bot.start(handler);
        logger.info(`✅ Registered start command`);
      } else {
        bot.command(name, handler);
        logger.info(`✅ Registered command: /${name}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to load command ${file}: ${error.message}`);
    }
  }
};
