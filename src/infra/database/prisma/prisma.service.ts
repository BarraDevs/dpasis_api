import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ errorFormat: 'minimal' });
  }

  public async onModuleInit() {
    await this.$connect();
  }

  public paginationFactory(page?: number, size?: number) {
    return {
      skip: (page && size) ? ((page - 1) * size) : undefined,
      take: (page && size) ? size : undefined,
    };
  }

  public async truncate() {
    await this.$transaction(async(tx) => {
      await tx.auditLog.deleteMany();
      await tx.nfmCronRun.deleteMany();
      await tx.nfm.deleteMany();
      await tx.nfseAttempt.deleteMany();
      await tx.nfseOutbox.deleteMany();
      await tx.nfse.deleteMany();
      await tx.nfseRpsSequence.deleteMany();
      await tx.nfsProviderConfig.deleteMany();
      await tx.clientInvoiceConfig.deleteMany();
      await tx.clientDiscount.deleteMany();
      await tx.clientType.deleteMany();
      await tx.clientAddress.deleteMany();
      await tx.clientContact.deleteMany();
      await tx.clientItem.deleteMany();
      await tx.clientAttachment.deleteMany();
      await tx.client.updateMany({ data: { parentClientId: null } });
      await tx.client.deleteMany();
      await tx.clientAttendance.deleteMany();
      await tx.clientMaintenanceTicket.deleteMany();
      await tx.clientSystemType.deleteMany();
      await tx.clientDescriptionType.deleteMany();
      await tx.clientDriveType.deleteMany();
      await tx.serviceAttendanceValue.deleteMany();
      await tx.service.deleteMany();
      await tx.billed.deleteMany();
      await tx.category.deleteMany();
      await tx.freight.deleteMany();
      await tx.deliveryTerm.deleteMany();
      await tx.warranty.deleteMany();
      await tx.proposalValidity.deleteMany();
      await tx.clientGroup.deleteMany();
      await tx.clientOwner.deleteMany();
      await tx.carrier.deleteMany();
      await tx.providerItemInstallment.deleteMany();
      await tx.providerItem.deleteMany();
      await tx.provider.deleteMany();
      await tx.company.deleteMany();
      await tx.seller.deleteMany();
      await tx.admin.deleteMany();
      await tx.account.deleteMany();
      await tx.resaleContact.deleteMany();
      await tx.department.deleteMany();
      await tx.resale.deleteMany();
      await tx.faq.deleteMany();
      await tx.honorific.deleteMany();
      await tx.cnaeNbsIndop.deleteMany();
      await tx.cnae.deleteMany();
      await tx.bank.deleteMany();
      await tx.nbs.deleteMany();
      await tx.indop.deleteMany();
    });
  }
}
