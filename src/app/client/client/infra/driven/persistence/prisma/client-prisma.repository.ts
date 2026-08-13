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

  public async save(entity: Client): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const created = await this.prisma.client.create({
      data: {
        id,
        ...props,
      },
    });
    return created.id;
  }

  public async edit(entity: Client): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    await this.prisma.client.update({
      where: { id: id! },
      data: {
        ...props,
      },
    });
  }

  public async findById(id: number): Promise<Client | null> {
    const data = await this.prisma.client.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ClientFactory.load({
      ...data,
      parentClientId: data.parentClientId ?? null,
      isSubClient: data.isSubClient,
      type: data.type as ClientType,
      invoiceType: data.invoiceType as ClientInvoiceType,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.client.delete({
      where: { id },
    });
  }

  public async linkAttendanceAndMaintenance(clientId: number, attendanceId: number, maintenanceTicketId: number): Promise<void> {
    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        attendanceId,
        maintenanceTicketId,
      },
    });
  }
}
