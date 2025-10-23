import { PrismaClient } from '@prisma/client';
import { AdminSeed } from './admin';

const prisma = new PrismaClient();

async function main() {
  await AdminSeed.seed(prisma);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async() => {
    await prisma.$disconnect();
  });
