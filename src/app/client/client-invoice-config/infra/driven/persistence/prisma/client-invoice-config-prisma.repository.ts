import { Injectable } from '@nestjs/common';
import { IClientInvoiceConfigRepository } from 'src/app/client/client-invoice-config/application/persistence/repository/client-invoice-config-repository.interface';
import { ClientInvoiceConfig } from 'src/app/client/client-invoice-config/domain/entities/client-invoice-config.entity';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigFactory } from 'src/app/client/client-invoice-config/domain/factories/client-invoice-config.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientInvoiceConfigRepositoryAdapterPrisma implements IClientInvoiceConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ClientInvoiceConfig): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const result = await this.prisma.clientInvoiceConfig.create({
      data: { ...props },
    });

    return result.id;
  }

  public async edit(entity: ClientInvoiceConfig): Promise<void> {
    const { id, ...props } = entity.props;

    await this.prisma.clientInvoiceConfig.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<ClientInvoiceConfig | null> {
    const data = await this.prisma.clientInvoiceConfig.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ClientInvoiceConfigFactory.load({
      ...data,
      type: data.type as ClientInvoiceConfigType,
      dueDateType: data.dueDateType as ClientInvoiceConfigDueDateType,
    });
  }

  public async findByClientId(clientId: number): Promise<ClientInvoiceConfig | null> {
    const data = await this.prisma.clientInvoiceConfig.findUnique({
      where: { clientId },
    });
    if (!data) return null;

    return ClientInvoiceConfigFactory.load({
      ...data,
      type: data.type as ClientInvoiceConfigType,
      dueDateType: data.dueDateType as ClientInvoiceConfigDueDateType,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientInvoiceConfig.delete({
      where: { id },
    });
  }
}
