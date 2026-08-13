import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { IClientDao } from 'src/app/client/client/application/persistence/dao/client-dao.interface';
import { FindAllClientQueryDto } from 'src/app/client/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { SearchClientInputDto } from 'src/app/client/client/application/usecases/search-client/dtos/search-client.dto';
import { FindSubClientsQueryDto } from 'src/app/client/client/application/usecases/find-sub-clients/dtos/find-sub-clients.dto';
import { PrismaFilterCompilerService } from 'src/infra/database/prisma/filter-compiler/prisma-filter-compiler.service';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientSelect = {
  id: true,
  type: true,
  document: true,
  ie: true,
  parentClientId: true,
  isSubClient: true,
  attendanceId: true,
  maintenanceTicketId: true,
  honorific: {
    select: {
      id: true,
      name: true,
    },
  },
  companyName: true,
  fantasyName: true,
  socialName: true,
  domain: true,
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
  resale: {
    select: {
      id: true,
      name: true,
    },
  },
  company: {
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaFilterCompiler: PrismaFilterCompilerService,
  ) {}

  public async findAll(queries: FindAllClientQueryDto): Promise<[ClientDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);
    const conditions: Prisma.ClientWhereInput[] = [];

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }
    if (queries.companyName?.trim()) {
      conditions.push({ companyName: { contains: queries.companyName.trim(), mode: 'insensitive' } });
    }
    if (queries.fantasyName?.trim()) {
      conditions.push({ fantasyName: { contains: queries.fantasyName.trim(), mode: 'insensitive' } });
    }
    if (queries.socialName?.trim()) {
      conditions.push({ socialName: { contains: queries.socialName.trim(), mode: 'insensitive' } });
    }
    if (queries.document?.trim()) {
      conditions.push({ document: { contains: queries.document.trim(), mode: 'insensitive' } });
    }
    if (queries.headquarters?.trim()) {
      conditions.push({ headquarters: { contains: queries.headquarters.trim(), mode: 'insensitive' } });
    }
    if (queries.domain?.trim()) {
      conditions.push({ domain: { contains: queries.domain.trim(), mode: 'insensitive' } });
    }
    if (queries.ie?.trim()) {
      conditions.push({ ie: { contains: queries.ie.trim(), mode: 'insensitive' } });
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

  public async search(input: SearchClientInputDto): Promise<[ClientDto[], number]> {
    const pagination = this.prisma.paginationFactory(input.page, input.size);
    const filterPlain =
      input.filter != null
        ? (JSON.parse(JSON.stringify(input.filter)) as Record<string, unknown>)
        : undefined;
    const filterConditions = this.prismaFilterCompiler.compileWhereFragments<Prisma.ClientWhereInput>(filterPlain);
    const conditions: Prisma.ClientWhereInput[] = [...filterConditions];
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

  public async countSubClients(clientId: number): Promise<number> {
    return this.prisma.client.count({
      where: { parentClientId: clientId },
    });
  }

  public async findSubClients(clientId: number, queries: FindSubClientsQueryDto): Promise<[ClientDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientWhereInput[] = [{ parentClientId: clientId }];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { companyName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { fantasyName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { socialName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { domain: { contains: queries.search.trim(), mode: 'insensitive' } },
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
