import * as quranController from '../controllers/quranController.js';

// Note: handleRandomAyah is already wrapped in catchAsync inside quranController.js
export const name = 'random';
export const handler = quranController.handleRandomAyah;
