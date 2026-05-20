import { PrismaClient } from '@prisma/client';
import { AccountClaimSeed } from './account-claims';
import { AdminSeed } from './admin';
import { ClientSequenceSeed } from './client-sequence';
import { ResaleSequenceSeed } from './resale-sequence';

const prisma = new PrismaClient();

async function main() {
  await AdminSeed.seed(prisma);
  await AccountClaimSeed.seed(prisma);
  // await BankSeed.seed(prisma);
  // await CompanySeed.seed(prisma);
  // await CategorySeed.seed(prisma);
  // await BilledSeed.seed(prisma);
  // await FreightSeed.seed(prisma);
  // await DeliveryTermSeed.seed(prisma);
  // await WarrantySeed.seed(prisma);
  // await ProposalValiditySeed.seed(prisma);
  // await CnaeSeed.seed(prisma);
  // await NbsSeed.seed(prisma);
  // await IndopSeed.seed(prisma);
  // await CnaeNbsIndopSeed.seed(prisma);
  // await ClientGroupSeed.seed(prisma);
  // await ClientOwnerSeed.seed(prisma);
  // await ClientDepartmentSeed.seed(prisma);
  // await ClientAttendanceSeed.seed(prisma);
  // await ClientMaintenanceTicketSeed.seed(prisma);
  // await ClientSystemTypeSeed.seed(prisma);
  // await ClientDescriptionTypeSeed.seed(prisma);
  // await ClientDriveTypeSeed.seed(prisma);
  // await ClientSeed.seed(prisma);
  await ClientSequenceSeed.seed(prisma);
  await ResaleSequenceSeed.seed(prisma);
  // await FindElegibleClientsNfmSeed.seed(prisma);
  // await ClientAddressSeed.seed(prisma);
  // await ClientContactSeed.seed(prisma);
  // await ClientAttachmentSeed.seed(prisma);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async() => {
    await prisma.$disconnect();
  });
