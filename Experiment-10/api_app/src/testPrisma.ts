import prisma from "./prismaClient";

async function main() {
  const tasks = await prisma.task.findMany();
  console.log("Tasks:", tasks);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
