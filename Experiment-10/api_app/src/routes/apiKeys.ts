import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const router = Router();
const prisma = new PrismaClient();
const MAX_KEYS_PER_USER = 10;

function parseIdParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  return Number(raw);
}

function generateApiKey(): string {
  return `sentinel_${crypto.randomBytes(20).toString("hex")}`;
}

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const userId: number = (req as any).userId;
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, key: true, isActive: true, createdAt: true, lastUsedAt: true },
    });
    const safeKeys = keys.map((k) => ({ ...k, key: k.key.slice(0, 16) + "••••••••••••••••" }));
    res.json({ keys: safeKeys, count: keys.length, remaining: MAX_KEYS_PER_USER - keys.filter((k) => k.isActive).length, limit: MAX_KEYS_PER_USER });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const userId: number = (req as any).userId;
  const { name } = req.body as { name?: string };
  if (!name || name.trim().length === 0) {
    res.status(400).json({ error: "Key name is required" });
    return;
  }
  try {
    const activeCount = await prisma.apiKey.count({ where: { userId, isActive: true } });
    if (activeCount >= MAX_KEYS_PER_USER) {
      res.status(403).json({ error: "API key limit reached", activeKeys: activeCount, limit: MAX_KEYS_PER_USER });
      return;
    }
    const key = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: { key, name: name.trim(), userId },
      select: { id: true, name: true, key: true, isActive: true, createdAt: true },
    });
    res.status(201).json({ message: "API key created. Save it now — we will never show the full key again.", apiKey });
  } catch (err) {
    res.status(500).json({ error: "Failed to create API key" });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const userId: number = (req as any).userId;
  const id = parseIdParam(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid API key id" }); return; }
  try {
    const apiKey = await prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) { res.status(404).json({ error: "API key not found" }); return; }
    if (apiKey.userId !== userId) { res.status(403).json({ error: "You don't own this API key" }); return; }
    if (!apiKey.isActive) { res.status(400).json({ error: "API key is already revoked" }); return; }
    await prisma.apiKey.update({ where: { id }, data: { isActive: false } });
    res.json({ message: "API key revoked successfully", id });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke API key" });
  }
});

router.patch("/:id/rename", async (req: Request, res: Response): Promise<void> => {
  const userId: number = (req as any).userId;
  const id = parseIdParam(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid API key id" }); return; }
  const { name } = req.body as { name?: string };
  if (!name || name.trim().length === 0) { res.status(400).json({ error: "New name is required" }); return; }
  try {
    const apiKey = await prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey || apiKey.userId !== userId) { res.status(404).json({ error: "API key not found" }); return; }
    const updated = await prisma.apiKey.update({ where: { id }, data: { name: name.trim() }, select: { id: true, name: true, isActive: true } });
    res.json({ message: "Key renamed", apiKey: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to rename API key" });
  }
});

export default router;
