import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BankDto } from 'src/app/bank/application/dtos/bank.dto';
import { IBankDao } from 'src/app/bank/application/persistence/dao/bank-dao.interface';
import { CreateBankInputDto } from 'src/app/bank/application/usecases/create-bank/dtos/create-bank.dto';
import { EditBankInputDto } from 'src/app/bank/application/usecases/edit-bank/dtos/edit-bank.dto';
import { FindAllBankQueryDto } from 'src/app/bank/application/usecases/find-all-bank/dtos/find-all-bank.dto';
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
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BankSelect;

@Injectable()
export class BankDaoAdapterPrisma implements IBankDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllBankQueryDto): Promise<[BankDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.BankWhereInput = queries.search
      ? {
        OR: [
          { drawer: { contains: queries.search, mode: 'insensitive' } },
          { bankName: { contains: queries.search, mode: 'insensitive' } },
          { bankCode: { contains: queries.search, mode: 'insensitive' } },
        ],
      }
      : {};

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

    return [banks, total];
  }

  public async findById(id: number): Promise<BankDto | null> {
    return this.prisma.bank.findUnique({
      where: { id },
      select: BankSelect,
    });
  }

  public async findByBankCodeAgencyAccount(
    bankCode: string,
    agency: string,
    account: string,
  ): Promise<BankDto | null> {
    return this.prisma.bank.findFirst({
      where: {
        bankCode: { equals: bankCode.trim(), mode: 'insensitive' },
        agency: { equals: agency.trim(), mode: 'insensitive' },
        account: { equals: account.trim(), mode: 'insensitive' },
      },
      select: BankSelect,
    });
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
      },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.bank.update({
      where: { id },
      data: { active },
    });
  }
}
