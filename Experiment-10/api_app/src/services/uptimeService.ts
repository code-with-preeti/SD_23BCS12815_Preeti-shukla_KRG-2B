import prisma from "../prismaClient";

// Calculate uptime percentage for a specific API
export const calculateUptime = async (apiId: number) => {
  const total = await prisma.apiCheck.count({ where: { apiId } });
  const up = await prisma.apiCheck.count({ where: { apiId, status: "up" } });

  if (total === 0) return 0; // no checks yet
  return Number(((up / total) * 100).toFixed(2));
};
