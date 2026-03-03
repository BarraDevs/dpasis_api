import { Injectable } from '@nestjs/common';
import { IClientRepository } from 'src/app/client/client/application/persistence/repository/client-repository.interface';
import { Client } from 'src/app/client/client/domain/entities/client.entity';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientFactory } from 'src/app/client/client/domain/factories/client.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientRepositoryAdapterPrisma implements IClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Client): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    await this.prisma.client.create({
      data: { ...props },
    });
  }

  public async edit(entity: Client): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    await this.prisma.client.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<Client | null> {
    const data = await this.prisma.client.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ClientFactory.load({
      ...data,
      type: data.type as ClientType,
      invoiceType: data.invoiceType as ClientInvoiceType,
    });
  }
}
