import * as quranController from '../controllers/quranController.js';
import { asyncHandler } from '../infrastructure/errorHandler.js';

export const name = 'surah';
export const handler = asyncHandler(quranController.handleFullSurah);
