import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResaleDto } from 'src/app/resale/resale/application/dtos/resale.dto';
import { IResaleDao } from 'src/app/resale/resale/application/persistence/dao/resale-dao.interface';
import { FindAllResaleQueryDto } from 'src/app/resale/resale/application/usecases/find-all-resale/dtos/find-all-resale.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ResaleSelect = {
  id: true,
  type: true,
  name: true,
  identifier: true,
  zipCode: true,
  street: true,
  neighborhood: true,
  city: true,
  state: true,
  licenseType: true,
  document: true,
  ie: true,
  phone01: true,
  phone02: true,
  voucher: true,
  email: true,
  website: true,
  nickname: true,
  socialName: true,
  validityDate: true,
  accessEmail: true,
  accessPassword: true,
  paymentDay: true,
  bonus: true,
  billingStartDay: true,
  receivesSupportEmail: true,
  servedByRoot: true,
  manufacturerResale: true,
  indicatorResale: true,
  recurringResale: true,
  profilePictureUrl: true,
  active: true,
  honorific: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ResaleSelect;

@Injectable()
export class ResaleDaoAdapterPrisma implements IResaleDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllResaleQueryDto): Promise<[ResaleDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ResaleWhereInput[] = [];

    if (queries.search?.trim()) {
      const term = queries.search.trim();
      conditions.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { document: { contains: term, mode: 'insensitive' } },
          { identifier: { contains: term, mode: 'insensitive' } },
          { nickname: { contains: term, mode: 'insensitive' } },
          { socialName: { contains: term, mode: 'insensitive' } },
          { accessEmail: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ResaleWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    return this.prisma.$transaction([
      this.prisma.resale.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        select: ResaleSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.resale.count({ where }),
    ]);
  }

  public async findById(id: number): Promise<ResaleDto | null> {
    return this.prisma.resale.findUnique({
      where: { id },
      select: ResaleSelect,
    });
  }

  public async findByDocument(document: string): Promise<ResaleDto | null> {
    return this.prisma.resale.findFirst({
      where: { document: { equals: document, mode: 'insensitive' } },
      select: ResaleSelect,
    });
  }

  public async findMaxId(): Promise<number> {
    const result = await this.prisma.resale.aggregate({ _max: { id: true } });
    return result._max.id ?? 0;
  }
}
