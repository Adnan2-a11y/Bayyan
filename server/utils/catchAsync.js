import { handleGlobalError } from '../core/errorHandler.js';

export const catchAsync = (fn) => {
  return (ctx, next) => {
    fn(ctx, next).catch((err) => {
      handleGlobalError(err, `Controller: ${fn.name}`);
      ctx.reply("⚠️ Something went wrong. Our team has been notified.");
    });
  };
};
