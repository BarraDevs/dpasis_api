import { PrismaClient } from '@prisma/client';
import { AdminSeed } from './admin';
import { BankSeed } from './bank';
import { ClientSeed } from './client';
import { ClientAddressSeed } from './client-address';
import { ClientContactSeed } from './client-contact';
import { ClientDepartmentSeed } from './client-department';
import { ClientGroupSeed } from './client-group';
import { ClientOwnerSeed } from './client-owner';
import { CnaeSeed } from './cnae';
import { CnaeNbsIndopSeed } from './cnae-nbs-indop';
import { CompanySeed } from './company';
import { IndopSeed } from './indop';
import { NbsSeed } from './nbs';

const prisma = new PrismaClient();

async function main() {
  await AdminSeed.seed(prisma);
  await BankSeed.seed(prisma);
  await CompanySeed.seed(prisma);
  await CnaeSeed.seed(prisma);
  await NbsSeed.seed(prisma);
  await IndopSeed.seed(prisma);
  await CnaeNbsIndopSeed.seed(prisma);
  await ClientGroupSeed.seed(prisma);
  await ClientOwnerSeed.seed(prisma);
  await ClientDepartmentSeed.seed(prisma);
  await ClientSeed.seed(prisma);
  await ClientAddressSeed.seed(prisma);
  await ClientContactSeed.seed(prisma);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async() => {
    await prisma.$disconnect();
  });
