import { Request, Response } from "express";
import prisma from "../prismaClient";

export const getPublicStats = async (_req: Request, res: Response) => {
  try {
    const [monitors, checks, upChecks] = await Promise.all([
      prisma.monitoredAPI.count(),
      prisma.apiCheck.count(),
      prisma.apiCheck.count({ where: { status: "up" } }),
    ]);

    const uptimePercent = checks === 0 ? 0 : Number(((upChecks / checks) * 100).toFixed(2));

    res.json({
      ok: true,
      monitors,
      checks,
      uptimePercent,
    });
  } catch (err) {
    res.json({
      ok: false,
      monitors: 0,
      checks: 0,
      uptimePercent: 0,
    });
  }
};

