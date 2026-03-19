import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientDescriptionTypeDto } from 'src/app/client/client-type/client-description-type/application/dtos/client-description-type.dto';
import { IClientDescriptionTypeDao } from 'src/app/client/client-type/client-description-type/application/persistence/dao/client-description-type-dao.interface';
import { CreateClientDescriptionTypeInputDto } from 'src/app/client/client-type/client-description-type/application/usecases/create-client-description-type/dtos/create-client-description-type.dto';
import { EditClientDescriptionTypeInputDto } from 'src/app/client/client-type/client-description-type/application/usecases/edit-client-description-type/dtos/edit-client-description-type.dto';
import { FindAllClientDescriptionTypeQueryDto } from 'src/app/client/client-type/client-description-type/application/usecases/find-all-client-description-type/dtos/find-all-client-description-type.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientDescriptionTypeSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientDescriptionTypeSelect;

@Injectable()
export class ClientDescriptionTypeDaoAdapterPrisma implements IClientDescriptionTypeDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientDescriptionTypeQueryDto): Promise<[ClientDescriptionTypeDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientDescriptionTypeWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientDescriptionTypeWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [clientDescriptionTypes, total] = await this.prisma.$transaction([
      this.prisma.clientDescriptionType.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientDescriptionTypeSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientDescriptionType.count({ where }),
    ]);

    return [clientDescriptionTypes, total];
  }

  public async findById(id: number): Promise<ClientDescriptionTypeDto | null> {
    return this.prisma.clientDescriptionType.findUnique({
      where: { id },
      select: ClientDescriptionTypeSelect,
    });
  }

  public async findByName(name: string): Promise<ClientDescriptionTypeDto | null> {
    return this.prisma.clientDescriptionType.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientDescriptionTypeSelect,
    });
  }

  public async save(data: CreateClientDescriptionTypeInputDto): Promise<number> {
    const result = await this.prisma.clientDescriptionType.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientDescriptionTypeInputDto): Promise<void> {
    await this.prisma.clientDescriptionType.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientDescriptionType.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientDescriptionType.update({
      where: { id },
      data: { active },
    });
  }
}
