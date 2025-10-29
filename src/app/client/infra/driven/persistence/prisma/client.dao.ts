import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientDto } from 'src/app/client/application/dtos/client.dto';
import { IClientDao } from 'src/app/client/application/persistence/dao/client-dao.interface';
import { FindAllClientQueryDto } from 'src/app/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientDaoAdapterPrisma implements IClientDao {
  constructor(private prisma: PrismaService) {}

  public async findAll(queries: FindAllClientQueryDto): Promise<[ClientDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ClientWhereInput = {
      AND: [
        {
          OR: [
            { companyName: { contains: queries.companyName } },
            { cnpj: { contains: queries.cnpj } },
          ],
        },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<ClientDto | null> {
    return this.prisma.client.findUnique({
      where: { id },
    });
  }

  public async findByCnpj(cnpj: string): Promise<ClientDto | null> {
    return this.prisma.client.findUnique({
      where: { cnpj },
    });
  }

  public async findByIe(ie: string): Promise<ClientDto | null> {
    return this.prisma.client.findUnique({
      where: { ie },
    });
  }
}
