import * as quranController from '../controllers/quranController.js';
import { asyncHandler } from '../infrastructure/errorHandler.js';

export const event = 'inline_query';
export const handler = asyncHandler(quranController.handleInlineQuery);
