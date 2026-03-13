import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientMaintenanceTicketTypeDto } from 'src/app/client/client-maintenance-ticket-type/application/dtos/client-maintenance-ticket-type.dto';
import { IClientMaintenanceTicketTypeDao } from 'src/app/client/client-maintenance-ticket-type/application/persistence/dao/client-maintenance-ticket-type-dao.interface';
import { CreateClientMaintenanceTicketTypeInputDto } from 'src/app/client/client-maintenance-ticket-type/application/usecases/create-client-maintenance-ticket-type/dtos/create-client-maintenance-ticket-type.dto';
import { EditClientMaintenanceTicketTypeInputDto } from 'src/app/client/client-maintenance-ticket-type/application/usecases/edit-client-maintenance-ticket-type/dtos/edit-client-maintenance-ticket-type.dto';
import { FindAllClientMaintenanceTicketTypeQueryDto } from 'src/app/client/client-maintenance-ticket-type/application/usecases/find-all-client-maintenance-ticket-type/dtos/find-all-client-maintenance-ticket-type.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientMaintenanceTicketTypeSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientMaintenanceTicketTypeSelect;

@Injectable()
export class ClientMaintenanceTicketTypeDaoAdapterPrisma implements IClientMaintenanceTicketTypeDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientMaintenanceTicketTypeQueryDto): Promise<[ClientMaintenanceTicketTypeDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ClientMaintenanceTicketTypeWhereInput = queries.search
      ? { name: { contains: queries.search, mode: 'insensitive' } }
      : {};

    const [clientMaintenanceTicketTypes, total] = await this.prisma.$transaction([
      this.prisma.clientMaintenanceTicketType.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientMaintenanceTicketTypeSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientMaintenanceTicketType.count({ where }),
    ]);

    return [clientMaintenanceTicketTypes, total];
  }

  public async findById(id: number): Promise<ClientMaintenanceTicketTypeDto | null> {
    return this.prisma.clientMaintenanceTicketType.findUnique({
      where: { id },
      select: ClientMaintenanceTicketTypeSelect,
    });
  }

  public async findByName(name: string): Promise<ClientMaintenanceTicketTypeDto | null> {
    return this.prisma.clientMaintenanceTicketType.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientMaintenanceTicketTypeSelect,
    });
  }

  public async save(data: CreateClientMaintenanceTicketTypeInputDto): Promise<number> {
    const result = await this.prisma.clientMaintenanceTicketType.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientMaintenanceTicketTypeInputDto): Promise<void> {
    await this.prisma.clientMaintenanceTicketType.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientMaintenanceTicketType.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientMaintenanceTicketType.update({
      where: { id },
      data: { active },
    });
  }
}
