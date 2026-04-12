import { PrismaClient } from '@prisma/client';
import { AccountClaimSeed } from './account-claims';
import { AdminSeed } from './admin';
import { BankSeed } from './bank';
import { BilledSeed } from './billed';
import { CategorySeed } from './category';
import { ClientSeed } from './client';
import { ClientAddressSeed } from './client-address';
import { ClientAttachmentSeed } from './client-attachment';
import { ClientAttendanceTypeSeed } from './client-attendance-type';
import { ClientContactSeed } from './client-contact';
import { ClientDepartmentSeed } from './client-department';
import { ClientDescriptionTypeSeed } from './client-description-type';
import { ClientDriveTypeSeed } from './client-drive-type';
import { ClientGroupSeed } from './client-group';
import { ClientMaintenanceTicketTypeSeed } from './client-maintenance-ticket-type';
import { ClientOwnerSeed } from './client-owner';
import { ClientSequenceSeed } from './client-sequence';
import { ClientSystemTypeSeed } from './client-system-type';
import { CnaeSeed } from './cnae';
import { CnaeNbsIndopSeed } from './cnae-nbs-indop';
import { CompanySeed } from './company';
import { DeliveryTermSeed } from './delivery-term';
import { FreightSeed } from './freight';
import { IndopSeed } from './indop';
import { NbsSeed } from './nbs';
import { ProposalValiditySeed } from './proposal-validity';
import { WarrantySeed } from './warranty';

const prisma = new PrismaClient();

async function main() {
  await AdminSeed.seed(prisma);
  await AccountClaimSeed.seed(prisma);
  await BankSeed.seed(prisma);
  await CompanySeed.seed(prisma);
  await CategorySeed.seed(prisma);
  await BilledSeed.seed(prisma);
  await FreightSeed.seed(prisma);
  await DeliveryTermSeed.seed(prisma);
  await WarrantySeed.seed(prisma);
  await ProposalValiditySeed.seed(prisma);
  await CnaeSeed.seed(prisma);
  await NbsSeed.seed(prisma);
  await IndopSeed.seed(prisma);
  await CnaeNbsIndopSeed.seed(prisma);
  await ClientGroupSeed.seed(prisma);
  await ClientOwnerSeed.seed(prisma);
  await ClientDepartmentSeed.seed(prisma);
  await ClientAttendanceTypeSeed.seed(prisma);
  await ClientMaintenanceTicketTypeSeed.seed(prisma);
  await ClientSystemTypeSeed.seed(prisma);
  await ClientDescriptionTypeSeed.seed(prisma);
  await ClientDriveTypeSeed.seed(prisma);
  await ClientSeed.seed(prisma);
  await ClientSequenceSeed.seed(prisma);
  await ClientAddressSeed.seed(prisma);
  await ClientContactSeed.seed(prisma);
  await ClientAttachmentSeed.seed(prisma);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async() => {
    await prisma.$disconnect();
  });
