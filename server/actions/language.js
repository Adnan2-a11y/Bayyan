import * as quranController from '../controllers/quranController.js';
import { asyncHandler } from '../infrastructure/errorHandler.js';

export const action = /^lang_([a-z]{2})_(\d+)_(\d+)$/;
export const handler = asyncHandler(quranController.handleLanguageChange);
