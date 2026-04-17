import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientTypeDto } from 'src/app/client/client-type/client-type/application/dtos/client-type.dto';
import { IClientTypeDao } from 'src/app/client/client-type/client-type/application/persistence/dao/client-type-dao.interface';
import { CreateClientTypeInputDto } from 'src/app/client/client-type/client-type/application/usecases/create-client-type/dtos/create-client-type.dto';
import { EditClientTypeInputDto } from 'src/app/client/client-type/client-type/application/usecases/edit-client-type/dtos/edit-client-type.dto';
import { FindAllClientTypeQueryDto } from 'src/app/client/client-type/client-type/application/usecases/find-all-client-type/dtos/find-all-client-type.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientTypeSelect = {
  id: true,
  clientId: true,
  quantity: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  clientAttendanceType: {
    select: {
      id: true,
      name: true,
    },
  },
  clientMaintenanceTicketType: {
    select: {
      id: true,
      name: true,
    },
  },
  clientSystemType: {
    select: {
      id: true,
      name: true,
    },
  },
  clientDescriptionType: {
    select: {
      id: true,
      name: true,
    },
  },
  clientDriveType: {
    select: {
      id: true,
      name: true,
    },
  },
  clientAddress: {
    select: {
      id: true,
      type: true,
      city: true,
      state: true,
    },
  },
} satisfies Prisma.ClientTypeSelect;

@Injectable()
export class ClientTypeDaoAdapterPrisma implements IClientTypeDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientTypeQueryDto): Promise<[ClientTypeDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientTypeWhereInput[] = [
      { clientId: { equals: queries.clientId } },
    ];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { clientSystemType: { name: { contains: queries.search.trim(), mode: 'insensitive' } } },
          { clientDescriptionType: { name: { contains: queries.search.trim(), mode: 'insensitive' } } },
          { clientDriveType: { name: { contains: queries.search.trim(), mode: 'insensitive' } } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientTypeWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [clientTypes, total] = await this.prisma.$transaction([
      this.prisma.clientType.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientTypeSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.clientType.count({ where }),
    ]);

    return [clientTypes, total];
  }

  public async findById(id: number): Promise<ClientTypeDto | null> {
    const row = await this.prisma.clientType.findUnique({
      where: { id },
      select: ClientTypeSelect,
    });

    if (!row) {
      return null;
    }

    return row;
  }

  public async save(data: CreateClientTypeInputDto): Promise<number> {
    const result = await this.prisma.clientType.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientTypeInputDto): Promise<void> {
    await this.prisma.clientType.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientType.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientType.update({
      where: { id },
      data: { active },
    });
  }
}
