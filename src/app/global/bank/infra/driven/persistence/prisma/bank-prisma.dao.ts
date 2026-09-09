import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BankDto } from 'src/app/global/bank/application/dtos/bank.dto';
import { toBankDto } from 'src/app/global/bank/application/mappers/to-bank.dto';
import { IBankDao } from 'src/app/global/bank/application/persistence/dao/bank-dao.interface';
import { CreateBankInputDto } from 'src/app/global/bank/application/usecases/create-bank/dtos/create-bank.dto';
import { EditBankInputDto } from 'src/app/global/bank/application/usecases/edit-bank/dtos/edit-bank.dto';
import { FindAllBankQueryDto } from 'src/app/global/bank/application/usecases/find-all-bank/dtos/find-all-bank.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const BankSelect = {
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
} satisfies Prisma.BankSelect;

@Injectable()
export class BankDaoAdapterPrisma implements IBankDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllBankQueryDto): Promise<[BankDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.BankWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { drawer: { contains: queries.search.trim(), mode: 'insensitive' } },
          { bankName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { bankCode: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.BankWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [banks, total] = await this.prisma.$transaction([
      this.prisma.bank.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: BankSelect,
        orderBy: { bankName: 'asc' },
      }),
      this.prisma.bank.count({ where }),
    ]);

    return [banks.map(row => toBankDto(row)), total];
  }

  public async findById(id: number): Promise<BankDto | null> {
    const row = await this.prisma.bank.findUnique({
      where: { id },
      select: BankSelect,
    });

    return row ? toBankDto(row) : null;
  }

  public async findByBankCodeAgencyAccount(
    bankCode: string,
    agency: string,
    account: string,
  ): Promise<BankDto | null> {
    const row = await this.prisma.bank.findFirst({
      where: {
        bankCode: { equals: bankCode.trim(), mode: 'insensitive' },
        agency: { equals: agency.trim(), mode: 'insensitive' },
        account: { equals: account.trim(), mode: 'insensitive' },
      },
      select: BankSelect,
    });

    return row ? toBankDto(row) : null;
  }

  public async save(data: CreateBankInputDto): Promise<number> {
    const result = await this.prisma.bank.create({
      data: {
        drawer: data.drawer.trim(),
        wallet: data.wallet.trim(),
        account: data.account.trim(),
        agency: data.agency.trim(),
        bankCode: data.bankCode.trim(),
        bankName: data.bankName.trim(),
        paymentLocation: data.paymentLocation?.trim() ?? null,
        ...this.chargePersistence(data),
      },
    });

    return result.id;
  }

  public async edit(id: number, data: EditBankInputDto): Promise<void> {
    await this.prisma.bank.update({
      where: { id },
      data: {
        drawer: data.drawer.trim(),
        wallet: data.wallet.trim(),
        account: data.account.trim(),
        agency: data.agency.trim(),
        bankCode: data.bankCode.trim(),
        bankName: data.bankName.trim(),
        paymentLocation: data.paymentLocation?.trim() ?? null,
        ...this.chargePersistence(data),
      },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.bank.update({
      where: { id },
      data: { active },
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.bank.delete({
      where: { id },
    });
  }

  public async countClientInvoiceConfigsByBankId(bankId: number): Promise<number> {
    return this.prisma.clientInvoiceConfig.count({
      where: { bankId },
    });
  }

  private chargePersistence(data: CreateBankInputDto | EditBankInputDto): Pick<
    Prisma.BankCreateInput,
    'fineRate' | 'moraRate'
  > {
    return {
      fineRate: data.fineRate ?? null,
      moraRate: data.moraRate ?? null,
    };
  }
}
