import { Worker } from "bullmq";
import { API_CHECK_QUEUE, ApiCheckJobData } from "./queues/apiCheckQueue";
import { redisConnection } from "./lib/redis";
import { runApiCheck } from "./services/apiMonitorService";

const worker = new Worker<ApiCheckJobData>(
  API_CHECK_QUEUE,
  async (job) => {
    await runApiCheck(job.data.apiId);
  },
  {
    connection: redisConnection,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 10),
  }
);

worker.on("ready", () => {
  console.log("[worker] ready and waiting for jobs");
});

worker.on("completed", (job) => {
  console.log(`[worker] completed job ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] failed job ${job?.id}`, err);
});
