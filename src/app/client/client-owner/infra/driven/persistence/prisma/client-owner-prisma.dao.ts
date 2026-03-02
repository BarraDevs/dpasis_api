import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientOwnerDto } from 'src/app/client/client-owner/application/dtos/client-owner.dto';
import { IClientOwnerDao } from 'src/app/client/client-owner/application/persistence/dao/client-owner-dao.interface';
import { CreateClientOwnerInputDto } from 'src/app/client/client-owner/application/usecases/create-client-owner/dtos/create-client-owner.dto';
import { EditClientOwnerInputDto } from 'src/app/client/client-owner/application/usecases/edit-client-owner/dtos/edit-client-owner.dto';
import { FindAllClientOwnerQueryDto } from 'src/app/client/client-owner/application/usecases/find-all-client-owner/dtos/find-all-client-owner.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientOwnerSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientOwnerSelect;

@Injectable()
export class ClientOwnerDaoAdapterPrisma implements IClientOwnerDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientOwnerQueryDto): Promise<[ClientOwnerDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ClientOwnerWhereInput = queries.search
      ? { name: { contains: queries.search, mode: 'insensitive' } }
      : {};

    const [clientOwners, total] = await this.prisma.$transaction([
      this.prisma.clientOwner.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientOwnerSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientOwner.count({ where }),
    ]);

    return [clientOwners, total];
  }

  public async findById(id: number): Promise<ClientOwnerDto | null> {
    return this.prisma.clientOwner.findUnique({
      where: { id },
      select: ClientOwnerSelect,
    });
  }

  public async findByName(name: string): Promise<ClientOwnerDto | null> {
    return this.prisma.clientOwner.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientOwnerSelect,
    });
  }

  public async save(data: CreateClientOwnerInputDto): Promise<number> {
    const result = await this.prisma.clientOwner.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientOwnerInputDto): Promise<void> {
    await this.prisma.clientOwner.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientOwner.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientOwner.update({
      where: { id },
      data: { active },
    });
  }
}
