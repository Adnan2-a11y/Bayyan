import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

async function test() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('REDIS_URL is not defined in .env');
    process.exit(1);
  }

  console.log('Connecting to:', redisUrl.replace(/\/\/.*@/, '//****@')); // Hide password

  // BullMQ connection can be an IORedis instance
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  const queueName = 'test-queue-' + Date.now();
  const queue = new Queue(queueName, { connection });
  
  await queue.add('test-job', { foo: 'bar' });
  console.log('Job added to queue');

  let jobProcessed = false;
  const worker = new Worker(queueName, async (job) => {
    console.log('Worker processed job:', job.data);
    jobProcessed = true;
  }, { connection });

  setTimeout(async () => {
    if (jobProcessed) {
      console.log('SUCCESS: BullMQ is working with your Redis Cloud instance.');
    } else {
      console.log('FAILURE: Job was not processed. Check connection/worker logs.');
    }
    await worker.close();
    await queue.close();
    await connection.quit();
    process.exit(0);
  }, 5000);
}

test().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
