import logger from '../infrastructure/logger.js';

export const handleGlobalError = (error, context = 'Unknown') => {
  const message = error.message || 'Internal Server Error';
  
  // Categorize for 100k scale monitoring
  if (error.response?.error_code === 429) {
    logger.warn(`[FloodWait] ${context}: Retry after ${error.response.parameters.retry_after}s`);
  } else if (error.name === 'MongoError') {
    logger.error(`[Database] ${context}: ${message}`);
  } else {
    logger.error(`[System] ${context}: ${message}`);
  }

  // Optional: Send alert to a private Dev Telegram Channel if critical
};
