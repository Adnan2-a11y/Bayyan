import { Queue } from 'bullmq';
try {
  const q = new Queue('test', { connection: { url: "redis://127.0.0.1:6379" } });
  console.log("Created queue with {url} object");
  q.close();
} catch (e) { console.error("Error {url}:", e.message); }
