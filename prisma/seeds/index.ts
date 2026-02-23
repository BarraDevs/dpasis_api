import { PrismaClient } from '@prisma/client';
import { AdminSeed } from './admin';
import { ClientGroupSeed } from './client-group';
import { ClientOwnerSeed } from './client-owner';

const prisma = new PrismaClient();

async function main() {
  await AdminSeed.seed(prisma);
  await ClientGroupSeed.seed(prisma);
  await ClientOwnerSeed.seed(prisma);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async() => {
    await prisma.$disconnect();
  });
