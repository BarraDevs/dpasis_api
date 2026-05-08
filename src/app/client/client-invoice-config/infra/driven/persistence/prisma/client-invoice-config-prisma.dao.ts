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
  dueMonth: true,
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
      ...data,
      type: data.type as ClientInvoiceConfigType,
      dueDateType: data.dueDateType as ClientInvoiceConfigDueDateType,
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
