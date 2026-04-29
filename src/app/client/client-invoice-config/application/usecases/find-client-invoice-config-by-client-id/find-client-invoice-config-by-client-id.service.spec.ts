import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientInvoiceConfigDto } from '../../dtos/client-invoice-config.dto';
import { FindClientInvoiceConfigByClientId } from './find-client-invoice-config-by-client-id.service';

describe('FindClientInvoiceConfigByClientId - Integration tests', () => {
  let sut: FindClientInvoiceConfigByClientId;
  let prisma: PrismaService;
  let clientId: number;
  let billingAddressId: number;
  let bankId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientInvoiceConfigModule],
    }).compile();

    sut = module.get(FindClientInvoiceConfigByClientId);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const address = await prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.BILLING,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        active: true,
      },
    });

    const bank = await prisma.bank.create({
      data: {
        drawer: 'Test Drawer',
        wallet: '123',
        account: '12345',
        agency: '0001',
        bankCode: '001',
        bankName: 'Test Bank',
        paymentLocation: null,
        active: true,
      },
    });

    clientId = client.id;
    billingAddressId = address.id;
    bankId = bank.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientInvoiceConfigNotFoundError when config does not exist for client', async() => {
    await expect(sut.execute(clientId)).rejects.toThrow(ClientInvoiceConfigNotFoundError);
    await expect(sut.execute(clientId)).rejects.toThrow(
      'Configuração de NF e boleto não encontrada.',
    );
  });

  it('should return config by clientId', async() => {
    const config = await prisma.clientInvoiceConfig.create({
      data: {
        clientId,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        months: [],
        billingAddressId,
        bankId,
        autoProtestBoleto: false,
        message: 'Mensagem teste',
      },
    });

    const result = await sut.execute(clientId);

    expect(result).not.toBeNull();
    expect(result).toEqual<ClientInvoiceConfigDto>({
      id: config.id,
      clientId,
      generateNf: true,
      type: ClientInvoiceConfigType.MONTHLY,
      emissionDay: 5,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      dueDateDay: 15,
      deadlineDays: null,
      months: [],
      billingAddressId,
      bankId,
      autoProtestBoleto: false,
      message: 'Mensagem teste',
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  });

  it('should return all config fields correctly', async() => {
    const config = await prisma.clientInvoiceConfig.create({
      data: {
        clientId,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 1,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 30,
        months: [6, 12],
        billingAddressId,
        bankId,
        autoProtestBoleto: true,
        message: null,
      },
    });

    const result = await sut.execute(clientId);

    expect(result).toEqual<ClientInvoiceConfigDto>({
      id: config.id,
      clientId,
      generateNf: false,
      type: ClientInvoiceConfigType.ANNUAL,
      emissionDay: 1,
      dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
      dueDateDay: null,
      deadlineDays: 30,
      months: [6, 12],
      billingAddressId,
      bankId,
      autoProtestBoleto: true,
      message: null,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  });
});
