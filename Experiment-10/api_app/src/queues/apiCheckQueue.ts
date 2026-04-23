import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis";

export const API_CHECK_QUEUE = "api-checks";
export const API_UPDATE_CHANNEL = "api-updates";

export type ApiCheckJobData = {
  apiId: number;
};

export const apiCheckQueue = new Queue<ApiCheckJobData>(API_CHECK_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 1000,
  },
});

