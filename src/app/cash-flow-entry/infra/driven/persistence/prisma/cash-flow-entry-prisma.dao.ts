import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CashFlowEntryDto } from 'src/app/cash-flow-entry/application/dtos/cash-flow-entry.dto';
import {
  CashFlowEntryEditData,
  CashFlowEntrySaveData,
  ICashFlowEntryDao,
} from 'src/app/cash-flow-entry/application/persistence/dao/cash-flow-entry-dao.interface';
import { FindAllCashFlowEntryQueryDto } from 'src/app/cash-flow-entry/application/usecases/find-all-cash-flow-entry/dtos/find-all-cash-flow-entry.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const CashFlowEntrySelect = {
  id: true,
  companyId: true,
  type: true,
  origin: true,
  amountInCents: true,
  occurredAt: true,
  description: true,
  nfseId: true,
  bankPaymentRequestCode: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CashFlowEntrySelect;

@Injectable()
export class CashFlowEntryDaoAdapterPrisma implements ICashFlowEntryDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllCashFlowEntryQueryDto): Promise<[CashFlowEntryDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.CashFlowEntryWhereInput[] = [
      { companyId: queries.companyId },
    ];

    if (queries.search?.trim()) {
      conditions.push({
        description: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.type) {
      conditions.push({ type: queries.type });
    }

    if (queries.startDate) {
      conditions.push({ occurredAt: { gte: new Date(queries.startDate) } });
    }

    if (queries.endDate) {
      conditions.push({ occurredAt: { lte: new Date(queries.endDate) } });
    }

    const where: Prisma.CashFlowEntryWhereInput = { AND: conditions };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.cashFlowEntry.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: CashFlowEntrySelect,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.cashFlowEntry.count({ where }),
    ]);

    return [rows, total];
  }

  public async findById(id: number): Promise<CashFlowEntryDto | null> {
    return this.prisma.cashFlowEntry.findUnique({
      where: { id },
      select: CashFlowEntrySelect,
    });
  }

  public async findByNfseId(nfseId: number): Promise<CashFlowEntryDto | null> {
    return this.prisma.cashFlowEntry.findUnique({
      where: { nfseId },
      select: CashFlowEntrySelect,
    });
  }

  public async save(data: CashFlowEntrySaveData): Promise<number> {
    const result = await this.prisma.cashFlowEntry.create({
      data: {
        companyId: data.companyId,
        type: data.type,
        origin: data.origin,
        amountInCents: data.amountInCents,
        occurredAt: data.occurredAt,
        description: data.description,
        nfseId: data.nfseId ?? null,
        bankPaymentRequestCode: data.bankPaymentRequestCode ?? null,
      },
    });

    return result.id;
  }

  public async edit(id: number, data: CashFlowEntryEditData): Promise<void> {
    await this.prisma.cashFlowEntry.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.cashFlowEntry.delete({
      where: { id },
    });
  }
}
