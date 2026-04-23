import prisma from "../prismaClient";

/**
 * Inserts a new API check and deletes older entries beyond last 10
 */
export async function insertApiCheck(apiId: number, status: string, responseTime?: number) {
  // 1️⃣ Insert new check
  await prisma.apiCheck.create({
    data: { apiId, status, responseTime },
  });

  // 2️⃣ Delete older entries beyond last 10
  const oldChecks: { id: number }[] = await prisma.apiCheck.findMany({
    where: { apiId },
    orderBy: { createdAt: 'desc' },
    skip: 10, // keep 10 newest
    select: { id: true }, // only need id
  });

  if (oldChecks.length > 0) {
    const idsToDelete = oldChecks.map(c => c.id); // c is now typed as {id:number}
    await prisma.apiCheck.deleteMany({ where: { id: { in: idsToDelete } } });
  }

  console.log(`API ${apiId} check inserted, old entries cleaned.`);
}
