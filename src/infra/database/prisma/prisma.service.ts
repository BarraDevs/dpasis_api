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
      // Audit logs (sem dependências)
      await tx.auditLog.deleteMany();
      await tx.nfm.deleteMany();
      // Nfs-e (referencia Company/Client por id solto, sem FK — apagar antes por hygiene)
      await tx.nfse.deleteMany();
      await tx.nfseRpsSequence.deleteMany();
      await tx.nfsProviderConfig.deleteMany(); // referencia Company (FK)
      // 0. ClientInvoiceConfig (referencia Client, ClientAddress, Bank)
      await tx.clientInvoiceConfig.deleteMany();
      // 0.1 ClientDiscount (referencia Client)
      await tx.clientDiscount.deleteMany();
      // 1. Tabelas que referenciam Client
      await tx.clientType.deleteMany();
      await tx.clientAddress.deleteMany();
      await tx.clientContact.deleteMany();
      await tx.clientItem.deleteMany();
      await tx.clientAttachment.deleteMany();
      // 2. Client (referencia ClientGroup, Resale e Company)
      // Auto-relação parentClientId: precisa zerar FKs antes do deleteMany em massa (PostgreSQL).
      await tx.client.updateMany({ data: { parentClientId: null } });
      await tx.client.deleteMany();
      // 3. ClientAttendance, ClientMaintenanceTicket, ClientSystemType, ClientDescriptionType e ClientDriveType (standalone)
      await tx.clientAttendance.deleteMany();
      await tx.clientMaintenanceTicket.deleteMany();
      await tx.clientSystemType.deleteMany();
      await tx.clientDescriptionType.deleteMany();
      await tx.clientDriveType.deleteMany();
      // 3.1 ServiceAttendanceValue (referencia Service)
      await tx.serviceAttendanceValue.deleteMany();
      // 3.2 Service (referencia Category e ServiceBilled)
      await tx.service.deleteMany();
      await tx.billed.deleteMany();
      await tx.category.deleteMany();
      await tx.freight.deleteMany();
      await tx.deliveryTerm.deleteMany();
      await tx.warranty.deleteMany();
      await tx.proposalValidity.deleteMany();
      // 4. ClientGroup e ClientOwner (agora sem referências de Client)
      await tx.clientGroup.deleteMany();
      await tx.clientOwner.deleteMany();
      // 5. Demais tabelas
      await tx.carrier.deleteMany();
      await tx.providerItemInstallment.deleteMany();
      await tx.providerItem.deleteMany();
      await tx.provider.deleteMany();
      await tx.company.deleteMany();
      await tx.seller.deleteMany();
      await tx.admin.deleteMany(); // Admin referencia Account
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
