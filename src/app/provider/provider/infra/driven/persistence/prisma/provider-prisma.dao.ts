import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProviderDto } from 'src/app/provider/provider/application/dtos/provider.dto';
import { IProviderDao } from 'src/app/provider/provider/application/persistence/dao/provider-dao.interface';
import { FindAllProviderQueryDto } from 'src/app/provider/provider/application/usecases/find-all-provider/dtos/find-all-provider.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ProviderSelect = {
  id: true,
  name: true,
  document: true,
  ie: true,
  fantasyName: true,
  email: true,
  website: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProviderSelect;

@Injectable()
export class ProviderDaoAdapterPrisma implements IProviderDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllProviderQueryDto): Promise<[ProviderDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ProviderWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { name: { contains: queries.search.trim(), mode: 'insensitive' } },
          { fantasyName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { document: { contains: queries.search.trim(), mode: 'insensitive' } },
          { email: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ProviderWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.provider.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        select: ProviderSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return [rows.map((row) => this.toDto(row)), total];
  }

  public async findById(id: number): Promise<ProviderDto | null> {
    const row = await this.prisma.provider.findUnique({
      where: { id },
      select: ProviderSelect,
    });
    if (!row) return null;

    return this.toDto(row);
  }

  public async findByDocument(document: string): Promise<ProviderDto | null> {
    const row = await this.prisma.provider.findFirst({
      where: { document: { equals: document, mode: 'insensitive' } },
      select: ProviderSelect,
    });
    if (!row) return null;

    return this.toDto(row);
  }

  public async findByEmail(email: string): Promise<ProviderDto | null> {
    const row = await this.prisma.provider.findFirst({
      where: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
      select: ProviderSelect,
    });
    if (!row) return null;

    return this.toDto(row);
  }

  private toDto(row: Prisma.ProviderGetPayload<{ select: typeof ProviderSelect }>): ProviderDto {
    return {
      ...row,
      ie: row.ie ?? null,
      complement: row.complement ?? null,
    };
  }
}
