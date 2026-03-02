import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientGroupDto } from 'src/app/client/client-group/application/dtos/client-group.dto';
import { IClientGroupDao } from 'src/app/client/client-group/application/persistence/dao/client-group-dao.interface';
import { CreateClientGroupInputDto } from 'src/app/client/client-group/application/usecases/create-client-group/dtos/create-client-group.dto';
import { EditClientGroupInputDto } from 'src/app/client/client-group/application/usecases/edit-client-group/dtos/edit-client-group.dto';
import { FindAllClientGroupQueryDto } from 'src/app/client/client-group/application/usecases/find-all-client-group/dtos/find-all-client-group.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientGroupSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientGroupSelect;

@Injectable()
export class ClientGroupDaoAdapterPrisma implements IClientGroupDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientGroupQueryDto): Promise<[ClientGroupDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ClientGroupWhereInput = queries.search
      ? { name: { contains: queries.search, mode: 'insensitive' } }
      : {};

    const [clientGroups, total] = await this.prisma.$transaction([
      this.prisma.clientGroup.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientGroupSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientGroup.count({ where }),
    ]);

    return [clientGroups, total];
  }

  public async findById(id: number): Promise<ClientGroupDto | null> {
    return this.prisma.clientGroup.findUnique({
      where: { id },
      select: ClientGroupSelect,
    });
  }

  public async findByName(name: string): Promise<ClientGroupDto | null> {
    return this.prisma.clientGroup.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientGroupSelect,
    });
  }

  public async save(data: CreateClientGroupInputDto): Promise<number> {
    const result = await this.prisma.clientGroup.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientGroupInputDto): Promise<void> {
    await this.prisma.clientGroup.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientGroup.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientGroup.update({
      where: { id },
      data: { active },
    });
  }
}
