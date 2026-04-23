import prisma from "../prismaClient";
import { insertApiCheck } from "./apiCheckService";
import { redisPublisher } from "../lib/redis";
import { API_UPDATE_CHANNEL } from "../queues/apiCheckQueue";

const REQUEST_TIMEOUT_MS = 5_000;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

function normalizeMethod(m: unknown): Method {
  const up = String(m ?? "GET").trim().toUpperCase();
  if (
    up === "GET" ||
    up === "POST" ||
    up === "PUT" ||
    up === "PATCH" ||
    up === "DELETE" ||
    up === "HEAD" ||
    up === "OPTIONS"
  ) {
    return up;
  }
  return "GET";
}

export async function runApiCheck(apiId: number): Promise<void> {
  const api = await prisma.monitoredAPI.findUnique({
    where: { id: apiId },
    select: { id: true, userId: true, name: true, url: true, method: true, headers: true, body: true },
  });

  if (!api) return;

  let status: "up" | "down" = "down";
  let responseTime: number | undefined;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const method = normalizeMethod(api.method);
    const headers: Record<string, string> = { "User-Agent": "api-sentinel" };
    if (api.headers && typeof api.headers === "object" && !Array.isArray(api.headers)) {
      for (const [k, v] of Object.entries(api.headers as Record<string, unknown>)) {
        if (typeof v === "string") headers[k] = v;
      }
    }

    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD" && api.body !== null && api.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      body = JSON.stringify(api.body);
    }

    const start = Date.now();
    const response = await fetch(api.url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    responseTime = Date.now() - start;
    if (response.status < 400) status = "up";
  } catch {
    status = "down";
  }

  await prisma.monitoredAPI.update({
    where: { id: api.id },
    data: { status },
  });
  await insertApiCheck(api.id, status, responseTime);

  await redisPublisher.publish(
    API_UPDATE_CHANNEL,
    JSON.stringify({
      type: "api-status-updated",
      userId: api.userId,
      apiId: api.id,
      status,
      responseTime: responseTime ?? null,
      checkedAt: new Date().toISOString(),
    })
  );
}

