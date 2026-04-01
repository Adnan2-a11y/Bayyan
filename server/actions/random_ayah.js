import * as quranController from '../controllers/quranController.js';

export const action = 'random_ayah';
export const handler = quranController.handleRandomAyah; // Already wrapped in controller using catchAsync
