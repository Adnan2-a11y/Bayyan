import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import logger from '../infrastructure/logger.js';

export const setupEvents = async (bot) => {
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const files = fs.readdirSync(currentDir).filter(file => file.endsWith('.js') && file !== 'index.js');

  for (const file of files) {
    try {
      const modulePath = pathToFileURL(path.join(currentDir, file)).href;
      const { event, handler } = await import(modulePath);

      if (!event || !handler) {
        logger.warn(`Skipping event ${file}: Missing 'event' or 'handler' export.`);
        continue;
      }

      bot.on(event, handler);
      logger.info(`✅ Registered event: ${event}`);
    } catch (error) {
      logger.error(`❌ Failed to load event ${file}: ${error.message}`);
    }
  }
};
