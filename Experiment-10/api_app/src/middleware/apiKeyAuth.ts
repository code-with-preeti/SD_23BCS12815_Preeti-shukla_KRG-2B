import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const key = req.headers["x-api-key"] as string | undefined;
  if (!key) {
    res.status(401).json({ error: "Missing API key", message: "Pass your key in the x-api-key header." });
    return;
  }
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!apiKey || !apiKey.isActive) {
      res.status(401).json({ error: "Invalid or revoked API key" });
      return;
    }
    prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
    (req as any).userId = apiKey.userId;
    (req as any).apiKeyId = apiKey.id;
    (req as any).user = apiKey.user;
    next();
  } catch (err) {
    console.error("[apiKeyAuth]", err);
    res.status(500).json({ error: "Internal server error during API key validation" });
  }
}

export async function flexAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if ((req as any).userId) {
    next();
    return;
  }
  await apiKeyAuth(req, res, next);
}
