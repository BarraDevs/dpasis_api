import { PrismaClient } from '@prisma/client';
import { AdminSeed } from './admin';
import { BankSeed } from './bank';
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
import { ClientSystemTypeSeed } from './client-system-type';
import { CnaeSeed } from './cnae';
import { CnaeNbsIndopSeed } from './cnae-nbs-indop';
import { CompanySeed } from './company';
import { IndopSeed } from './indop';
import { NbsSeed } from './nbs';
import { ServiceBilledSeed } from './service-billed';
import { ServiceCategorySeed } from './service-category';
import { ServiceDeliveryTermSeed } from './service-delivery-term';
import { ServiceFreightSeed } from './service-freight';
import { ServiceProposalValiditySeed } from './service-proposal-validity';
import { ServiceWarrantySeed } from './service-warranty';

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
  await ClientAttendanceTypeSeed.seed(prisma);
  await ClientMaintenanceTicketTypeSeed.seed(prisma);
  await ClientSystemTypeSeed.seed(prisma);
  await ClientDescriptionTypeSeed.seed(prisma);
  await ClientDriveTypeSeed.seed(prisma);
  await ServiceCategorySeed.seed(prisma);
  await ServiceBilledSeed.seed(prisma);
  await ServiceFreightSeed.seed(prisma);
  await ServiceDeliveryTermSeed.seed(prisma);
  await ServiceWarrantySeed.seed(prisma);
  await ServiceProposalValiditySeed.seed(prisma);
  await ClientSeed.seed(prisma);
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
