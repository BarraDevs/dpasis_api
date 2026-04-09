import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BilledDto } from 'src/app/service/billed/application/dtos/billed.dto';
import { IBilledDao } from 'src/app/service/billed/application/persistence/dao/billed-dao.interface';
import { FindAllBilledQueryDto } from 'src/app/service/billed/application/usecases/find-all-billed/dtos/find-all-billed.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const BilledSelect = {
  id: true,
  description: true,
  isJunction: true,
  installmentDays: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BilledSelect;

@Injectable()
export class BilledDaoAdapterPrisma implements IBilledDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllBilledQueryDto): Promise<[BilledDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.BilledWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        description: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.BilledWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.billed.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: BilledSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.billed.count({ where }),
    ]);

    return [rows, total];
  }

  public async findById(id: number): Promise<BilledDto | null> {
    return this.prisma.billed.findUnique({
      where: { id },
      select: BilledSelect,
    });
  }

  public async countServicesByBilledId(billedId: number): Promise<number> {
    return this.prisma.service.count({
      where: { billedId: billedId },
    });
  }
}
