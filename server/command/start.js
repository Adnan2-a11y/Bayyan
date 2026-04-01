import * as botController from '../controllers/botController.js';
import { asyncHandler } from '../infrastructure/errorHandler.js';

export const name = 'start';
export const handler = asyncHandler(botController.handleStart);
