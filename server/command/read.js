import * as quranController from '../controllers/quranController.js';
import { asyncHandler } from '../infrastructure/errorHandler.js';

export const name = 'read';
export const handler = asyncHandler(quranController.handleReadAyah);
