import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { IClientInvoiceConfigDao } from 'src/app/client/client-invoice-config/application/persistence/dao/client-invoice-config-dao.interface';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientInvoiceConfigSelect = {
  id: true,
  clientId: true,
  generateNf: true,
  type: true,
  emissionDay: true,
  dueDateType: true,
  dueDateDay: true,
  deadlineDays: true,
  months: true,
  billingAddressId: true,
  bankId: true,
  autoProtestBoleto: true,
  message: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientInvoiceConfigSelect;

type ClientInvoiceConfigData = Prisma.ClientInvoiceConfigGetPayload<{
  select: typeof ClientInvoiceConfigSelect;
}>;

@Injectable()
export class ClientInvoiceConfigDaoAdapterPrisma implements IClientInvoiceConfigDao {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDto(data: ClientInvoiceConfigData): ClientInvoiceConfigDto {
    return {
      id: data.id,
      clientId: data.clientId,
      generateNf: data.generateNf,
      type: data.type as ClientInvoiceConfigType,
      emissionDay: data.emissionDay,
      dueDateType: data.dueDateType as ClientInvoiceConfigDueDateType,
      dueDateDay: data.dueDateDay,
      deadlineDays: data.deadlineDays,
      months: data.months,
      billingAddressId: data.billingAddressId,
      bankId: data.bankId,
      autoProtestBoleto: data.autoProtestBoleto,
      message: data.message,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  public async findById(id: number): Promise<ClientInvoiceConfigDto | null> {
    const data = await this.prisma.clientInvoiceConfig.findUnique({
      where: { id },
      select: ClientInvoiceConfigSelect,
    });
    if (!data) return null;

    return this.mapToDto(data);
  }

  public async findByClientId(clientId: number): Promise<ClientInvoiceConfigDto | null> {
    const data = await this.prisma.clientInvoiceConfig.findUnique({
      where: { clientId },
      select: ClientInvoiceConfigSelect,
    });
    if (!data) return null;

    return this.mapToDto(data);
  }
}
