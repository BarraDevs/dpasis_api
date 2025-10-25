import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDto } from '../../application/dtos/client.dto';
import { IClientDao } from '../../application/persistence/dao/client-dao.interface';
import { FindAllClientQueryDto } from '../../application/usecases/find-all-client/dtos/find-all-client.dto';

@Injectable()
export class ClientDaoAdapterPrisma implements IClientDao {
  constructor(private prisma: PrismaService) {}

  public findAll(queries: FindAllClientQueryDto): Promise<[ClientDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ClientWhereInput = {
      AND: [
        {
          OR: [
            { companyName: { contains: queries.search } },
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

  public findById(id: string): Promise<ClientDto | null> {
    return this.prisma.client.findUnique({
      where: { id },
    });
  }

  public findByCnpj(cnpj: string): Promise<ClientDto | null> {
    return this.prisma.client.findUnique({
      where: { cnpj },
    });
  }

  public findByIe(ie: string): Promise<ClientDto | null> {
    return this.prisma.client.findUnique({
      where: { ie },
    });
  }
}
