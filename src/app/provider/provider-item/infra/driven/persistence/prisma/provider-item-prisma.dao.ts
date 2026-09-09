import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProviderItemDto } from 'src/app/provider/provider-item/application/dtos/provider-item.dto';
import { ProviderItemInstallmentDto } from 'src/app/provider/provider-item/application/dtos/provider-item-installment.dto';
import { IProviderItemDao } from 'src/app/provider/provider-item/application/persistence/dao/provider-item-dao.interface';
import { FindAllProviderItemQueryDto } from 'src/app/provider/provider-item/application/usecases/find-all-provider-item/dtos/find-all-provider-item.dto';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { toBankDto } from 'src/app/global/bank/application/mappers/to-bank.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ProviderItemSelect = {
  id: true,
  providerId: true,
  description: true,
  totalValueInCents: true,
  installmentsCount: true,
  scheduleType: true,
  intervalDays: true,
  dueDay: true,
  firstDueDate: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  bank: {
    select: {
      id: true,
      drawer: true,
      wallet: true,
      account: true,
      agency: true,
      bankCode: true,
      bankName: true,
      paymentLocation: true,
      fineRate: true,
      moraRate: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  installments: {
    select: {
      id: true,
      number: true,
      valueInCents: true,
      dueDate: true,
      status: true,
    },
    orderBy: {
      number: 'asc' as const,
    },
  },
} satisfies Prisma.ProviderItemSelect;

type ProviderItemRow = Prisma.ProviderItemGetPayload<{ select: typeof ProviderItemSelect }>;

@Injectable()
export class ProviderItemDaoAdapterPrisma implements IProviderItemDao {
  constructor(private readonly prisma: PrismaService) {}

  private toInstallmentDto(row: ProviderItemRow['installments'][number]): ProviderItemInstallmentDto {
    return {
      id: row.id,
      number: row.number,
      valueInCents: row.valueInCents,
      dueDate: row.dueDate,
      status: row.status as ProviderItemInstallmentStatus,
    };
  }

  private toDto(row: ProviderItemRow): ProviderItemDto {
    return {
      id: row.id,
      providerId: row.providerId,
      description: row.description,
      totalValueInCents: row.totalValueInCents,
      installmentsCount: row.installmentsCount,
      scheduleType: row.scheduleType as ProviderItemScheduleType,
      intervalDays: row.intervalDays,
      dueDay: row.dueDay,
      firstDueDate: row.firstDueDate,
      bank: toBankDto(row.bank),
      active: row.active,
      installments: row.installments.map((installment) => this.toInstallmentDto(installment)),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public async findAll(queries: FindAllProviderItemQueryDto): Promise<[ProviderItemDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ProviderItemWhereInput[] = [
      { providerId: { equals: queries.providerId } },
    ];

    if (queries.active != null) {
      conditions.push({ active: { equals: queries.active } });
    }

    if (queries.search?.trim()) {
      conditions.push({
        description: {
          contains: queries.search.trim(),
          mode: 'insensitive',
        },
      });
    }

    const where: Prisma.ProviderItemWhereInput = { AND: conditions };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.providerItem.findMany({
        where,
        select: ProviderItemSelect,
        ...pagination,
        orderBy: { id: 'desc' },
      }),
      this.prisma.providerItem.count({ where }),
    ]);

    return [rows.map((row) => this.toDto(row)), total];
  }

  public async findById(id: number): Promise<ProviderItemDto | null> {
    const row = await this.prisma.providerItem.findUnique({
      where: { id },
      select: ProviderItemSelect,
    });

    if (!row) {
      return null;
    }

    return this.toDto(row);
  }
}
