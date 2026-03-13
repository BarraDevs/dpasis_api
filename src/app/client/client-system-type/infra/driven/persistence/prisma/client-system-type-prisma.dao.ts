import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientSystemTypeDto } from 'src/app/client/client-system-type/application/dtos/client-system-type.dto';
import { IClientSystemTypeDao } from 'src/app/client/client-system-type/application/persistence/dao/client-system-type-dao.interface';
import { CreateClientSystemTypeInputDto } from 'src/app/client/client-system-type/application/usecases/create-client-system-type/dtos/create-client-system-type.dto';
import { EditClientSystemTypeInputDto } from 'src/app/client/client-system-type/application/usecases/edit-client-system-type/dtos/edit-client-system-type.dto';
import { FindAllClientSystemTypeQueryDto } from 'src/app/client/client-system-type/application/usecases/find-all-client-system-type/dtos/find-all-client-system-type.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientSystemTypeSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSystemTypeSelect;

@Injectable()
export class ClientSystemTypeDaoAdapterPrisma implements IClientSystemTypeDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientSystemTypeQueryDto): Promise<[ClientSystemTypeDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ClientSystemTypeWhereInput = queries.search
      ? { name: { contains: queries.search, mode: 'insensitive' } }
      : {};

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

  public async save(data: CreateClientSystemTypeInputDto): Promise<number> {
    const result = await this.prisma.clientSystemType.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientSystemTypeInputDto): Promise<void> {
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

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientSystemType.update({
      where: { id },
      data: { active },
    });
  }
}
