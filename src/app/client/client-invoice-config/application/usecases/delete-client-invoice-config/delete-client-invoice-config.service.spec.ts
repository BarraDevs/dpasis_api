import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteClientInvoiceConfig } from './delete-client-invoice-config.service';

describe('DeleteClientInvoiceConfig - Integration tests', () => {
  let sut: DeleteClientInvoiceConfig;
  let prisma: PrismaService;
  let configId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientInvoiceConfigModule],
    }).compile();

    sut = module.get(DeleteClientInvoiceConfig);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
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

    const config = await prisma.clientInvoiceConfig.create({
      data: {
        clientId: client.id,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        months: [],
        billingAddressId: address.id,
        bankId: bank.id,
        autoProtestBoleto: false,
        message: null,
      },
    });

    configId = config.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientInvoiceConfigNotFoundError when config does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ClientInvoiceConfigNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow(
      'Configuração de NF e boleto não encontrada.',
    );
  });

  it('should delete config from database', async() => {
    await sut.execute(configId);

    const deleted = await prisma.clientInvoiceConfig.findUnique({
      where: { id: configId },
    });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const result = await sut.execute(configId);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });
  });
});
