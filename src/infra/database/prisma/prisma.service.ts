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
      // 0. ClientInvoiceConfig (referencia Client, ClientAddress, Bank)
      await tx.clientInvoiceConfig.deleteMany();
      // 0.1 ClientDiscount (referencia Client)
      await tx.clientDiscount.deleteMany();
      // 1. Tabelas que referenciam Client
      await tx.clientAddress.deleteMany();
      await tx.clientContact.deleteMany();
      await tx.clientItem.deleteMany();
      await tx.clientAttachment.deleteMany();
      // 2. Client (referencia ClientGroup e ClientOwner)
      await tx.client.deleteMany();
      // 3. ClientDepartment, ClientAttendanceType, ClientMaintenanceTicketType, ClientSystemType e ClientDescriptionType (standalone)
      await tx.clientDepartment.deleteMany();
      await tx.clientAttendanceType.deleteMany();
      await tx.clientMaintenanceTicketType.deleteMany();
      await tx.clientSystemType.deleteMany();
      await tx.clientDescriptionType.deleteMany();
      // 4. ClientGroup e ClientOwner (agora sem referências de Client)
      await tx.clientGroup.deleteMany();
      await tx.clientOwner.deleteMany();
      // 5. Demais tabelas
      await tx.company.deleteMany();
      await tx.admin.deleteMany(); // Admin referencia Account
      await tx.account.deleteMany();
      await tx.faq.deleteMany();
      await tx.cnaeNbsIndop.deleteMany();
      await tx.cnae.deleteMany();
      await tx.bank.deleteMany();
      await tx.nbs.deleteMany();
      await tx.indop.deleteMany();
    });
  }
}
