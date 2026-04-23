import prisma from "../prismaClient";

export const getApiHistory = async (apiId: number) => {
  return prisma.apiCheck.findMany({
    where: { apiId },
    orderBy: { createdAt: "desc" },
    take: 10, 
  });
};
