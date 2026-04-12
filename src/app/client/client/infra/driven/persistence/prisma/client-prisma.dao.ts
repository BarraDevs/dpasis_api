import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { IClientDao } from 'src/app/client/client/application/persistence/dao/client-dao.interface';
import { FindAllClientQueryDto } from 'src/app/client/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { FindSubClientsQueryDto } from 'src/app/client/client/application/usecases/find-sub-clients/dtos/find-sub-clients.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientSelect = {
  id: true,
  type: true,
  document: true,
  ie: true,
  parentClientId: true,
  isSubClient: true,
  companyName: true,
  fantasyName: true,
  headquarters: true,
  invoiceType: true,
  generateInvoice: true,
  active: true,
  group: {
    select: {
      id: true,
      name: true,
    },
  },
  owner: {
    select: {
      id: true,
      name: true,
    },
  },
  companies: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

@Injectable()
export class ClientDaoAdapterPrisma implements IClientDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientQueryDto): Promise<[ClientDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { companyName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { fantasyName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { document: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    if (queries.isSubClient != null && queries.isSubClient !== undefined) {
      conditions.push({ isSubClient: queries.isSubClient });
    }

    const where: Prisma.ClientWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    return this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        select: ClientSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.client.count({ where }),
    ]);
  }

  public async findById(id: number): Promise<ClientDto | null> {
    return this.prisma.client.findUnique({
      where: { id },
      select: ClientSelect,
    });
  }

  public async findByDocument(document: string): Promise<ClientDto | null> {
    return this.prisma.client.findFirst({
      where: { document: { equals: document, mode: 'insensitive' } },
      select: ClientSelect,
    });
  }

  public async findMaxId(): Promise<number> {
    const result = await this.prisma.client.aggregate({ _max: { id: true } });
    return result._max.id ?? 0;
  }

  public async findSubClients(clientId: number, queries: FindSubClientsQueryDto): Promise<[ClientDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientWhereInput[] = [{ parentClientId: clientId }];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { companyName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { fantasyName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { document: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientWhereInput = { AND: conditions };

    return this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        select: ClientSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.client.count({ where }),
    ]);
  }
}
