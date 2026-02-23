import { PrismaClient } from '@prisma/client';
import { AdminSeed } from './admin';
import { ClientGroupSeed } from './client-group';

const prisma = new PrismaClient();

async function main() {
  await AdminSeed.seed(prisma);
  await ClientGroupSeed.seed(prisma);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async() => {
    await prisma.$disconnect();
  });
