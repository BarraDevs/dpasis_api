import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BudgetDto } from 'src/app/budget/application/dtos/budget.dto';
import { FindAllBudgetQueroDto, IBudgetDao } from 'src/app/budget/application/persistence/dao/budget-dao.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const budgetSelect = {
  id: true,
  companyId: true,
  clientId: true,
  sellerId: true,
  freightType: true,
  shipperId: true,
  freightValueInCents: true,
  subtotalInCents: true,
  discountInCents: true,
  totalInCents: true,
  commercialProcess: true,
  commercialNote: true,
  observations: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      itemType: true,
      productId: true,
      serviceId: true,
      description: true,
      quantity: true,
      unitPriceInCents: true,
      discountInCents: true,
      subtotalInCents: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.BudgetSelect;

@Injectable()
export class BudgetDaoAdapterPrisma implements IBudgetDao {
  constructor(private prisma: PrismaService) {}

  public async findAll(queries: FindAllBudgetQueroDto): Promise<[BudgetDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.limit);

    const where: Prisma.BudgetWhereInput = {
      AND: [
        { companyId: queries.companyId ? { equals: queries.companyId } : undefined },
        { clientId: queries.clientId ? { equals: queries.clientId } : undefined },
        { sellerId: queries.sellerId ? { equals: queries.sellerId } : undefined },
        { shipperId: queries.shipperId ? { equals: queries.shipperId } : undefined },
        { freightType: queries.freightType ? { contains: queries.freightType, mode: 'insensitive' } : undefined },
        { status: queries.status ? { equals: queries.status } : undefined },
        { createdAt: queries.createdAtStart || queries.createdAtEnd ? { gte: queries.createdAtStart, lte: queries.createdAtEnd } : undefined },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.budget.findMany({
        where,
        select: budgetSelect,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.budget.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<BudgetDto | null> {
    return this.prisma.budget.findUnique({
      where: { id },
      select: budgetSelect,
    });
  }
}
