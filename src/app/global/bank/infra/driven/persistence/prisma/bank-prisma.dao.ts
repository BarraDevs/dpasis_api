import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BankDto } from 'src/app/global/bank/application/dtos/bank.dto';
import { toBankDtoFromPersistence } from 'src/app/global/bank/application/mappers/to-bank.dto';
import {
  BankIntegrationPersistence,
  BankIntegrationRecord,
  EditBankData,
  IBankDao,
  SaveBankData,
} from 'src/app/global/bank/application/persistence/dao/bank-dao.interface';
import { FindAllBankQueryDto } from 'src/app/global/bank/application/usecases/find-all-bank/dtos/find-all-bank.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const BankPublicSelect = {
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
  apiUrl: true,
  clientIdHint: true,
  clientIdCiphertext: true,
  clientSecretCiphertext: true,
  webhookTokenHash: true,
  certFormat: true,
  certFilePath: true,
  certificateNotAfter: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BankSelect;

const BankIntegrationSelect = {
  id: true,
  drawer: true,
  bankName: true,
  apiUrl: true,
  clientIdCiphertext: true,
  clientSecretCiphertext: true,
  webhookTokenHash: true,
  certFormat: true,
  certFilePath: true,
  keyFilePath: true,
  certPasswordCiphertext: true,
  certificateNotAfter: true,
} satisfies Prisma.BankSelect;

type BankPublicRow = Prisma.BankGetPayload<{ select: typeof BankPublicSelect }>;
type BankIntegrationRow = Prisma.BankGetPayload<{ select: typeof BankIntegrationSelect }>;

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
        select: BankPublicSelect,
        orderBy: { bankName: 'asc' },
      }),
      this.prisma.bank.count({ where }),
    ]);

    return [banks.map((row) => this.toPublicDto(row)), total];
  }

  public async findById(id: number): Promise<BankDto | null> {
    const row = await this.prisma.bank.findUnique({
      where: { id },
      select: BankPublicSelect,
    });

    return row ? this.toPublicDto(row) : null;
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
      select: BankPublicSelect,
    });

    return row ? this.toPublicDto(row) : null;
  }

  public async findIntegrationById(id: number): Promise<BankIntegrationRecord | null> {
    const row = await this.prisma.bank.findUnique({
      where: { id },
      select: BankIntegrationSelect,
    });

    return row ? this.toIntegrationRecord(row) : null;
  }

  public async findByWebhookTokenHash(hash: string): Promise<BankIntegrationRecord | null> {
    const row = await this.prisma.bank.findUnique({
      where: { webhookTokenHash: hash },
      select: BankIntegrationSelect,
    });

    return row ? this.toIntegrationRecord(row) : null;
  }

  public async findAllWithCertificate(): Promise<BankIntegrationRecord[]> {
    const rows = await this.prisma.bank.findMany({
      where: { certFilePath: { not: null } },
      select: BankIntegrationSelect,
      orderBy: { id: 'asc' },
    });

    return rows.map((row) => this.toIntegrationRecord(row));
  }

  public async save(data: SaveBankData): Promise<number> {
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
        ...this.integrationCreate(data),
      },
    });

    return result.id;
  }

  public async edit(id: number, data: EditBankData): Promise<void> {
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
        ...this.integrationUpdate(data),
      },
    });
  }

  public async updateIntegration(id: number, data: BankIntegrationPersistence): Promise<void> {
    await this.prisma.bank.update({
      where: { id },
      data: this.integrationUpdate(data),
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

  private toPublicDto(row: BankPublicRow): BankDto {
    return toBankDtoFromPersistence(row);
  }

  private toIntegrationRecord(row: BankIntegrationRow): BankIntegrationRecord {
    return {
      id: row.id,
      drawer: row.drawer,
      bankName: row.bankName,
      apiUrl: row.apiUrl,
      clientIdCiphertext: row.clientIdCiphertext,
      clientSecretCiphertext: row.clientSecretCiphertext,
      webhookTokenHash: row.webhookTokenHash,
      certFormat: row.certFormat,
      certFilePath: row.certFilePath,
      keyFilePath: row.keyFilePath,
      certPasswordCiphertext: row.certPasswordCiphertext,
      certificateNotAfter: row.certificateNotAfter,
    };
  }

  private chargePersistence(data: SaveBankData | EditBankData): Pick<
    Prisma.BankCreateInput,
    'fineRate' | 'moraRate'
  > {
    return {
      fineRate: data.fineRate ?? null,
      moraRate: data.moraRate ?? null,
    };
  }

  private integrationCreate(data: SaveBankData) {
    return {
      apiUrl: data.apiUrl ?? null,
      clientIdCiphertext: data.clientIdCiphertext ?? null,
      clientIdHint: data.clientIdHint ?? null,
      clientSecretCiphertext: data.clientSecretCiphertext ?? null,
      webhookTokenHash: data.webhookTokenHash ?? null,
      certFormat: data.certFormat ?? null,
      certFilePath: data.certFilePath ?? null,
      keyFilePath: data.keyFilePath ?? null,
      certPasswordCiphertext: data.certPasswordCiphertext ?? null,
      certificateNotAfter: data.certificateNotAfter ?? null,
    };
  }

  private integrationUpdate(data: BankIntegrationPersistence): Prisma.BankUpdateInput {
    const update: Prisma.BankUpdateInput = {};

    if (data.apiUrl !== undefined) {
      update.apiUrl = data.apiUrl;
    }
    if (data.clientIdCiphertext !== undefined) {
      update.clientIdCiphertext = data.clientIdCiphertext;
    }
    if (data.clientIdHint !== undefined) {
      update.clientIdHint = data.clientIdHint;
    }
    if (data.clientSecretCiphertext !== undefined) {
      update.clientSecretCiphertext = data.clientSecretCiphertext;
    }
    if (data.webhookTokenHash !== undefined) {
      update.webhookTokenHash = data.webhookTokenHash;
    }
    if (data.certFormat !== undefined) {
      update.certFormat = data.certFormat;
    }
    if (data.certFilePath !== undefined) {
      update.certFilePath = data.certFilePath;
    }
    if (data.keyFilePath !== undefined) {
      update.keyFilePath = data.keyFilePath;
    }
    if (data.certPasswordCiphertext !== undefined) {
      update.certPasswordCiphertext = data.certPasswordCiphertext;
    }
    if (data.certificateNotAfter !== undefined) {
      update.certificateNotAfter = data.certificateNotAfter;
    }

    return update;
  }
}
