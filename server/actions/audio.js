import * as quranController from '../controllers/quranController.js';
import { asyncHandler } from '../infrastructure/errorHandler.js';

export const action = /^audio_(\d+)_(\d+)$/;
export const handler = asyncHandler(quranController.handleAudioRequest);
