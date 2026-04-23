import { Request, Response, NextFunction } from "express";

interface QueueEntry {
  resolve: (value: void) => void;
  reject: (reason?: string) => void;
  timestamp: number;
}

interface UserBucket {
  count: number;
  resetAt: number;
  queue: QueueEntry[];
  processing: boolean;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const MAX_QUEUE_SIZE = 5;
const QUEUE_TIMEOUT = 15_000;

const store = new Map<string, UserBucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store.entries()) {
    if (now > bucket.resetAt && bucket.queue.length === 0) {
      store.delete(key);
    }
  }
}, 5 * 60_000);

function getBucket(userId: string): UserBucket {
  const now = Date.now();
  let bucket = store.get(userId);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS, queue: [], processing: false };
    store.set(userId, bucket);
  }
  return bucket;
}

async function drainQueue(bucket: UserBucket): Promise<void> {
  if (bucket.processing) return;
  bucket.processing = true;
  while (bucket.queue.length > 0) {
    const now = Date.now();
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + WINDOW_MS;
    }
    if (bucket.count < MAX_REQUESTS) {
      const entry = bucket.queue.shift()!;
      if (Date.now() - entry.timestamp > QUEUE_TIMEOUT) {
        entry.reject("timeout");
        continue;
      }
      bucket.count++;
      entry.resolve();
    } else {
      const waitMs = bucket.resetAt - Date.now();
      await new Promise<void>((r) => setTimeout(r, waitMs > 0 ? waitMs : 0));
    }
  }
  bucket.processing = false;
}

export function getRateLimitStats(userId: string) {
  const bucket = store.get(userId);
  const now = Date.now();
  if (!bucket || now > bucket.resetAt) {
    return { used: 0, remaining: MAX_REQUESTS, resetAt: now + WINDOW_MS, queued: 0 };
  }
  return {
    used: bucket.count,
    remaining: Math.max(0, MAX_REQUESTS - bucket.count),
    resetAt: bucket.resetAt,
    queued: bucket.queue.length,
  };
}

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const rawUserId: string | number | undefined = (req as any).userId ?? (req as any).user?.userId;
  const userId = rawUserId !== undefined ? String(rawUserId) : undefined;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized — no user identity found" });
    return;
  }
  const bucket = getBucket(userId);
  const now = Date.now();
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - bucket.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
  if (bucket.count < MAX_REQUESTS) {
    bucket.count++;
    next();
    return;
  }
  if (bucket.queue.length >= MAX_QUEUE_SIZE) {
    res.status(429).json({
      error: "Rate limit exceeded",
      message: `Limit ${MAX_REQUESTS} reached and queue is full.`,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    });
    return;
  }
  res.setHeader("X-RateLimit-Queued", bucket.queue.length + 1);
  new Promise<void>((resolve, reject) => {
    bucket.queue.push({ resolve, reject, timestamp: now });
    drainQueue(bucket);
  })
    .then(() => next())
    .catch((reason) => {
      if (reason === "timeout") {
        res.status(429).json({ error: "Queue timeout", message: "Request waited too long in queue." });
      } else {
        res.status(429).json({ error: "Rate limit exceeded" });
      }
    });
}
