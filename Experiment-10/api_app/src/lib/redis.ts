import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const redisPublisher = new IORedis(redisUrl);
export const redisSubscriber = new IORedis(redisUrl);

