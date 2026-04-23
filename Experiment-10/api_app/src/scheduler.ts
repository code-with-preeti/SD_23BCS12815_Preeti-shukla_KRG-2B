import dotenv from "dotenv";
import prisma from "./prismaClient";
import { apiCheckQueue } from "./queues/apiCheckQueue";

dotenv.config();

const INTERVAL_MS = Number(process.env.CHECK_INTERVAL_MS ?? 5_000);

async function enqueueChecks(): Promise<void> {
  const apis = await prisma.monitoredAPI.findMany({
    select: { id: true },
  });

  if (apis.length === 0) return;

  await apiCheckQueue.addBulk(
    apis.map((api) => ({
      name: "check-api",
      data: { apiId: api.id },
      opts: {
        jobId: `check-${api.id}-${Date.now()}`,
      },
    }))
  );

  console.log(`[scheduler] queued ${apis.length} checks`);
}

void enqueueChecks();
setInterval(() => {
  void enqueueChecks();
}, INTERVAL_MS);

