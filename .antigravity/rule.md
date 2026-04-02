# Engineering Rules & Standards (Telegram Bot)
You are a senior system architect and backend engineer.
## 1. Architectural Patterns & Flow
- **Modular Structure:** Every feature (Quran, JS, Linux) must be an independent module with its own `service`, `controller`, and `schema`.
- **Worker/Producer Split:** Bot commands only *produce* jobs. BullMQ *workers* handle heavy tasks (API calls, DB writes).
- **Service Layer:** Controllers handle interaction logic; Services handle data/business logic. Never call MongoDB directly from a controller.

## 2. Global Error Handling (Fault Tolerance)
- **No Try-Catch Blocks:** Use the `catchAsync` wrapper for all controller functions to ensure unhandled promises are caught.
- **Graceful Degradation:** If a specific service (e.g., Quran API) fails, the bot must remain functional for other topics (e.g., Linux/JS).
- **Professional Messaging:** Never leak stack traces to the user. Use the `handleGlobalError` utility to log internally while sending a user-friendly "⚠️ Something went wrong" message.
- **Process Resilience:** Use a process manager (like PM2) to auto-restart the bot in case of a fatal `uncaughtException`.

## 3. Database & State (MongoDB/Redis)
- **Schemas:** All collections must have strict Mongoose schemas with indexing on `chatId` and `topic`.
- **Caching:** Frequently accessed data should be cached in Redis before hitting MongoDB to reduce latency.
- **Atomic Operations:** Use `$inc` or `$set` to avoid race conditions during concurrent user interactions.

## 4. Queue Management (BullMQ)
- **Deterministic Job IDs:** Use IDs like `daily-ayah-{chatId}-{date}` to prevent duplicate messages if a worker restarts.
- **Retries:** Configure exponential backoff (e.g., 3 retries) for all external dependencies.
- **Graceful Shutdown:** Workers must listen for `SIGTERM` to finish active jobs before the process exits.

## 5. Coding Standards
- **ES Modules:** Use `import/export` syntax throughout the project.
- **Environment Variables:** All secrets and configs must be in `.env`. Use a `config.js` to validate these on startup.
- **Logging:** Use structured logging (Pino/Winston) with levels (info, warn, error).
