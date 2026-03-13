import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientDriveTypeDto } from 'src/app/client/client-type/client-drive-type/application/dtos/client-drive-type.dto';
import { IClientDriveTypeDao } from 'src/app/client/client-type/client-drive-type/application/persistence/dao/client-drive-type-dao.interface';
import { CreateClientDriveTypeInputDto } from 'src/app/client/client-type/client-drive-type/application/usecases/create-client-drive-type/dtos/create-client-drive-type.dto';
import { EditClientDriveTypeInputDto } from 'src/app/client/client-type/client-drive-type/application/usecases/edit-client-drive-type/dtos/edit-client-drive-type.dto';
import { FindAllClientDriveTypeQueryDto } from 'src/app/client/client-type/client-drive-type/application/usecases/find-all-client-drive-type/dtos/find-all-client-drive-type.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientDriveTypeSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientDriveTypeSelect;

@Injectable()
export class ClientDriveTypeDaoAdapterPrisma implements IClientDriveTypeDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientDriveTypeQueryDto): Promise<[ClientDriveTypeDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ClientDriveTypeWhereInput = queries.search
      ? { name: { contains: queries.search, mode: 'insensitive' } }
      : {};

    const [clientDriveTypes, total] = await this.prisma.$transaction([
      this.prisma.clientDriveType.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientDriveTypeSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientDriveType.count({ where }),
    ]);

    return [clientDriveTypes, total];
  }

  public async findById(id: number): Promise<ClientDriveTypeDto | null> {
    return this.prisma.clientDriveType.findUnique({
      where: { id },
      select: ClientDriveTypeSelect,
    });
  }

  public async findByName(name: string): Promise<ClientDriveTypeDto | null> {
    return this.prisma.clientDriveType.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientDriveTypeSelect,
    });
  }

  public async save(data: CreateClientDriveTypeInputDto): Promise<number> {
    const result = await this.prisma.clientDriveType.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientDriveTypeInputDto): Promise<void> {
    await this.prisma.clientDriveType.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientDriveType.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientDriveType.update({
      where: { id },
      data: { active },
    });
  }
}
