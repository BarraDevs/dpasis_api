import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressInUseError } from 'src/app/client/client-address/domain/errors/client-address-in-use.error';
import { ClientAddressNotFoundError } from 'src/app/client/client-address/domain/errors/client-address-not-found.error';
import { ClientMainAddressCannotBeDeletedError } from 'src/app/client/client-address/domain/errors/client-main-address-cannot-be-deleted.error';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteClientAddress } from './delete-client-address.service';

describe('DeleteClientAddress', () => {
  let sut: DeleteClientAddress;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAddressModule],
    }).compile();

    sut = module.get(DeleteClientAddress);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should throw ClientAddressNotFoundError when address does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ClientAddressNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Endereço do cliente não encontrado.');
  });

  it('should throw ClientMainAddressCannotBeDeletedError when address is MAIN type', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Principal',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    await expect(sut.execute(created.id)).rejects.toThrow(ClientMainAddressCannotBeDeletedError);
    await expect(sut.execute(created.id)).rejects.toThrow('Endereço principal não pode ser excluído.');

    const stillExists = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should throw ClientAddressInUseError when address is used as billing in invoice config', async() => {
    const billingAddress = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '12345-678',
        street: 'Rua Cobrança',
        number: '2',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
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

    await prisma.clientInvoiceConfig.create({
      data: {
        clientId,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        months: [],
        billingAddressId: billingAddress.id,
        bankId: bank.id,
        autoProtestBoleto: false,
        message: null,
      },
    });

    await expect(sut.execute(billingAddress.id)).rejects.toThrow(ClientAddressInUseError);
    await expect(sut.execute(billingAddress.id)).rejects.toThrow(
      'Não é possível excluir o endereço pois está vinculado a configurações de faturamento.',
    );

    const stillExists = await prisma.clientAddress.findUnique({ where: { id: billingAddress.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete address and return success message when address is not MAIN', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '12345-678',
        street: 'Rua Cobrança',
        number: '2',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });

    const deleted = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });

  it('should delete address of type SUPPORT', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.SUPPORT,
        zipCode: '98765-432',
        street: 'Rua Chamado',
        number: '3',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result.message).toBe('Exclusão realizada com sucesso');
    const deleted = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });

  it('should delete address of type CORRESPONDENCE', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.CORRESPONDENCE,
        zipCode: '11111-111',
        street: 'Rua Correspondência',
        number: '4',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result.message).toBe('Exclusão realizada com sucesso');
    const deleted = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
