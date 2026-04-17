import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientMaintenanceTicketDto } from 'src/app/client/client-maintenance-ticket/application/dtos/client-maintenance-ticket.dto';
import { IClientMaintenanceTicketDao } from 'src/app/client/client-maintenance-ticket/application/persistence/dao/client-maintenance-ticket-dao.interface';
import { CreateClientMaintenanceTicketInputDto } from 'src/app/client/client-maintenance-ticket/application/usecases/create-client-maintenance-ticket/dtos/create-client-maintenance-ticket.dto';
import { EditClientMaintenanceTicketInputDto } from 'src/app/client/client-maintenance-ticket/application/usecases/edit-client-maintenance-ticket/dtos/edit-client-maintenance-ticket.dto';
import { FindAllClientMaintenanceTicketQueryDto } from 'src/app/client/client-maintenance-ticket/application/usecases/find-all-client-maintenance-ticket/dtos/find-all-client-maintenance-ticket.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientMaintenanceTicketSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientMaintenanceTicketSelect;

@Injectable()
export class ClientMaintenanceTicketDaoAdapterPrisma implements IClientMaintenanceTicketDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientMaintenanceTicketQueryDto): Promise<[ClientMaintenanceTicketDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientMaintenanceTicketWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientMaintenanceTicketWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [clientMaintenanceTickets, total] = await this.prisma.$transaction([
      this.prisma.clientMaintenanceTicket.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientMaintenanceTicketSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientMaintenanceTicket.count({ where }),
    ]);

    return [clientMaintenanceTickets, total];
  }

  public async findById(id: number): Promise<ClientMaintenanceTicketDto | null> {
    return this.prisma.clientMaintenanceTicket.findUnique({
      where: { id },
      select: ClientMaintenanceTicketSelect,
    });
  }

  public async findByName(name: string): Promise<ClientMaintenanceTicketDto | null> {
    return this.prisma.clientMaintenanceTicket.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientMaintenanceTicketSelect,
    });
  }

  public async save(data: CreateClientMaintenanceTicketInputDto): Promise<number> {
    const result = await this.prisma.clientMaintenanceTicket.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientMaintenanceTicketInputDto): Promise<void> {
    await this.prisma.clientMaintenanceTicket.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientMaintenanceTicket.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientMaintenanceTicket.update({
      where: { id },
      data: { active },
    });
  }
}
