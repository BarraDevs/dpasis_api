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

  /**
   * Apaga o banco inteiro entre specs de integração.
   *
   * A guarda existe porque `.env.test` e `.env.development` já apontaram para o **mesmo** banco: um
   * `npm test` numa máquina configurada para trabalho — ou para homologação — apagava tudo sem
   * perguntar, e a única defesa era alguém lembrar. O nome do banco terminar em `_test` é a
   * convenção; quem não a segue não roda a suíte de integração.
   */
  public async truncate() {
    PrismaService.ensureTestDatabase();

    await this.$transaction(async(tx) => {
      await tx.auditLog.deleteMany();
      await tx.cashFlowEntry.deleteMany();
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
      await tx.emailTemplate.deleteMany();
      await tx.emailTemplateVariable.deleteMany();
      await tx.faq.deleteMany();
      await tx.honorific.deleteMany();
      await tx.cnaeNbsIndop.deleteMany();
      await tx.cnae.deleteMany();
      await tx.bank.deleteMany();
      await tx.nbs.deleteMany();
      await tx.indop.deleteMany();
    });
  }

  /**
   * O nome sai da própria `DATABASE_URL` — a mesma string que o Prisma usou para conectar —, e não
   * de uma variável separada que poderia discordar dela.
   */
  private static ensureTestDatabase(): void {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL não está definida: truncate() recusado.');
    }

    let databaseName: string;
    try {
      databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');
    }
    catch {
      throw new Error('DATABASE_URL inválida: truncate() recusado.');
    }

    if (!databaseName.endsWith('_test')) {
      throw new Error(
        `truncate() recusado: o banco "${databaseName}" não termina em "_test". A suíte de `
        + 'integração apaga todas as tabelas — aponte DATABASE_URL para um banco de teste dedicado '
        + '(ver README, "Banco de teste").',
      );
    }
  }
}
