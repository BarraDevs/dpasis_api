import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { IClientInvoiceConfigDao } from 'src/app/client/client-invoice-config/application/persistence/dao/client-invoice-config-dao.interface';
import { FindAllClientInvoiceConfigQueryDto } from 'src/app/client/client-invoice-config/application/usecases/find-all-client-invoice-config/dtos/find-all-client-invoice-config.dto';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientInvoiceConfigBillingAddressSelect = {
  id: true,
  clientId: true,
  type: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  cityCodeIbge: true,
  state: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientAddressSelect;

const ClientInvoiceConfigBankSelect = {
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

const ClientInvoiceConfigSelect = {
  id: true,
  clientId: true,
  generateNf: true,
  type: true,
  emissionDay: true,
  dueDateType: true,
  dueDateDay: true,
  dueMonth: true,
  deadlineDays: true,
  months: true,
  billingAddress: {
    select: ClientInvoiceConfigBillingAddressSelect,
  },
  bank: {
    select: ClientInvoiceConfigBankSelect,
  },
  autoProtestBoleto: true,
  message: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientInvoiceConfigSelect;

type ClientInvoiceConfigData = Prisma.ClientInvoiceConfigGetPayload<{
  select: typeof ClientInvoiceConfigSelect;
}>;

@Injectable()
export class ClientInvoiceConfigDaoAdapterPrisma implements IClientInvoiceConfigDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientInvoiceConfigQueryDto): Promise<[ClientInvoiceConfigDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientInvoiceConfigWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        message: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.dueDateDay != null) {
      conditions.push({ dueDateDay: queries.dueDateDay });
    }

    if (queries.generateNf != null) {
      conditions.push({ generateNf: queries.generateNf });
    }

    const where: Prisma.ClientInvoiceConfigWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.clientInvoiceConfig.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientInvoiceConfigSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clientInvoiceConfig.count({ where }),
    ]);

    return [rows.map(row => this.mapToDto(row)), total];
  }

  private mapToDto(data: ClientInvoiceConfigData): ClientInvoiceConfigDto {
    return {
      id: data.id,
      clientId: data.clientId,
      generateNf: data.generateNf,
      type: data.type as ClientInvoiceConfigType,
      emissionDay: data.emissionDay,
      dueDateType: data.dueDateType as ClientInvoiceConfigDueDateType,
      dueDateDay: data.dueDateDay,
      dueMonth: data.dueMonth,
      deadlineDays: data.deadlineDays,
      months: data.months,
      billingAddress: { ...data.billingAddress },
      bank: data.bank,
      autoProtestBoleto: data.autoProtestBoleto,
      message: data.message,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  public async findById(id: number): Promise<ClientInvoiceConfigDto | null> {
    const data = await this.prisma.clientInvoiceConfig.findUnique({
      where: { id },
      select: ClientInvoiceConfigSelect,
    });
    if (!data) return null;

    return this.mapToDto(data);
  }

  public async findByClientId(clientId: number): Promise<ClientInvoiceConfigDto | null> {
    const data = await this.prisma.clientInvoiceConfig.findUnique({
      where: { clientId },
      select: ClientInvoiceConfigSelect,
    });
    if (!data) return null;

    return this.mapToDto(data);
  }
}
