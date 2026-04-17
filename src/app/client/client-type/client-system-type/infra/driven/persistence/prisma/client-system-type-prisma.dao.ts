import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientSystemTypeDto } from 'src/app/client/client-type/client-system-type/application/dtos/client-system-type.dto';
import {
  type ClientSystemTypeEditInput,
  type ClientSystemTypeSaveInput,
  IClientSystemTypeDao,
} from 'src/app/client/client-type/client-system-type/application/persistence/dao/client-system-type-dao.interface';
import { FindAllClientSystemTypeQueryDto } from 'src/app/client/client-type/client-system-type/application/usecases/find-all-client-system-type/dtos/find-all-client-system-type.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientSystemTypeSelect = {
  id: true,
  name: true,
  imageUrl: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSystemTypeSelect;

@Injectable()
export class ClientSystemTypeDaoAdapterPrisma implements IClientSystemTypeDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientSystemTypeQueryDto): Promise<[ClientSystemTypeDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientSystemTypeWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientSystemTypeWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [clientSystemTypes, total] = await this.prisma.$transaction([
      this.prisma.clientSystemType.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientSystemTypeSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientSystemType.count({ where }),
    ]);

    return [clientSystemTypes, total];
  }

  public async findById(id: number): Promise<ClientSystemTypeDto | null> {
    return this.prisma.clientSystemType.findUnique({
      where: { id },
      select: ClientSystemTypeSelect,
    });
  }

  public async findByName(name: string): Promise<ClientSystemTypeDto | null> {
    return this.prisma.clientSystemType.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientSystemTypeSelect,
    });
  }

  public async save(data: ClientSystemTypeSaveInput): Promise<number> {
    const result = await this.prisma.clientSystemType.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: ClientSystemTypeEditInput): Promise<void> {
    await this.prisma.clientSystemType.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientSystemType.delete({
      where: { id },
    });
  }

  public async countClientTypesBySystemTypeId(systemTypeId: number): Promise<number> {
    return this.prisma.clientType.count({
      where: { clientSystemTypeId: systemTypeId },
    });
  }

  public async findByImageUrlExcludingId(imageUrl: string, excludeId: number): Promise<number> {
    return this.prisma.clientSystemType.count({
      where: {
        imageUrl: { equals: imageUrl, mode: 'insensitive' },
        id: { not: excludeId },
      },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientSystemType.update({
      where: { id },
      data: { active },
    });
  }
}
