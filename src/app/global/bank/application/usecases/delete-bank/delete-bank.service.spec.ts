import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { BankModule } from 'src/app/global/bank/bank.module';
import { BankInUseError } from 'src/app/global/bank/domain/errors/bank-in-use.error';
import { BankNotFoundError } from 'src/app/global/bank/domain/errors/bank-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteBank } from './delete-bank.service';

describe('DeleteBank - Integration tests', () => {
  let sut: DeleteBank;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BankModule],
    }).compile();

    sut = module.get(DeleteBank);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw BankNotFoundError when bank does not exist', async() => {
    const id = 99999;

    await expect(sut.execute(id)).rejects.toThrow(BankNotFoundError);
  });

  it('should throw BankInUseError when bank is linked to a client invoice config', async() => {
    const suffix = `${Date.now()}`;
    const bank = await prisma.bank.create({
      data: {
        drawer: 'Drawer',
        wallet: '1',
        account: `A${suffix}`.slice(0, 20),
        agency: '0001',
        bankCode: `B${suffix}`.slice(0, 20),
        bankName: 'Bank',
        paymentLocation: null,
        active: true,
      },
    });

    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${suffix}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: String(Date.now()).padStart(14, '0').slice(-14),
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

    await prisma.clientInvoiceConfig.create({
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

    await expect(sut.execute(bank.id)).rejects.toThrow(BankInUseError);
    await expect(sut.execute(bank.id)).rejects.toThrow(
      'Não é possível excluir o banco pois existem configurações de fatura vinculadas.',
    );

    const stillExists = await prisma.bank.findUnique({ where: { id: bank.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete bank and return success message when bank has no linked configs', async() => {
    const suffix = `${Date.now()}`;
    const created = await prisma.bank.create({
      data: {
        drawer: 'Drawer',
        wallet: '1',
        account: `X${suffix}`.slice(0, 20),
        agency: '0001',
        bankCode: `Y${suffix}`.slice(0, 20),
        bankName: 'Bank',
        paymentLocation: null,
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Banco excluído com sucesso.' });

    const found = await prisma.bank.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });
});
