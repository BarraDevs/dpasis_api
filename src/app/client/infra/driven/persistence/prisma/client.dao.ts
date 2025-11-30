import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientDto } from 'src/app/client/application/dtos/client.dto';
import { IClientDao } from 'src/app/client/application/persistence/dao/client-dao.interface';
import { FindAllClientQueryDto } from 'src/app/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const clientSelect = {
  id: true,
  kind: true,
  cnpj: true,
  ie: true,
  group: true,
  type: true,
  generateInvoice: true,
  companyName: true,
  fantasyName: true,
  owner: true,
  headquarters: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  companies: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ClientSelect;

@Injectable()
export class ClientDaoAdapterPrisma implements IClientDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientQueryDto): Promise<[ClientDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ClientWhereInput = {
      AND: [
        { kind: queries.kind ? { contains: queries.kind, mode: 'insensitive' } : undefined },
        { cnpj: queries.cnpj ? { contains: queries.cnpj } : undefined },
        { ie: queries.ie ? { contains: queries.ie } : undefined },
        { group: queries.group ? { contains: queries.group, mode: 'insensitive' } : undefined },
        { type: queries.type ? { contains: queries.type, mode: 'insensitive' } : undefined },
        { companyName: queries.companyName ? { contains: queries.companyName, mode: 'insensitive' } : undefined },
        { fantasyName: queries.fantasyName ? { contains: queries.fantasyName, mode: 'insensitive' } : undefined },
        { owner: queries.owner ? { contains: queries.owner, mode: 'insensitive' } : undefined },
        { headquarters: queries.headquarters ? { contains: queries.headquarters, mode: 'insensitive' } : undefined },
        { companies: queries.companyIds ? { some: { id: { in: queries.companyIds } } } : undefined },
        { active: queries.active !== undefined ? queries.active : undefined },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        select: clientSelect,
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
      select: clientSelect,
    });
  }

  public async findByCnpj(cnpj: string): Promise<ClientDto | null> {
    return this.prisma.client.findUnique({
      where: { cnpj },
      select: clientSelect,
    });
  }

  public async findByIe(ie: string): Promise<ClientDto | null> {
    return this.prisma.client.findUnique({
      where: { ie },
      select: clientSelect,
    });
  }
}
