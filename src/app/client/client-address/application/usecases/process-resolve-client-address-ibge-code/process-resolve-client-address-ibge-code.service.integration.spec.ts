import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { CepLookupModule } from 'src/infra/cep-lookup/cep-lookup.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAddressPersistenceModule } from '../../persistence/client-address-persistence.module';
import { ProcessResolveClientAddressIbgeCode } from './process-resolve-client-address-ibge-code.service';

describe('ProcessResolveClientAddressIbgeCode - Integration tests', () => {
  let sut: ProcessResolveClientAddressIbgeCode;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ClientAddressPersistenceModule,
        CepLookupModule.register(),
      ],
      providers: [ProcessResolveClientAddressIbgeCode],
    }).compile();

    sut = module.get(ProcessResolveClientAddressIbgeCode);
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

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should persist cityCodeIbge when gateway resolves and zipCode still matches', async() => {
    // Arrange
    const zipCode = '3550308';
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode,
        street: 'Rua Teste',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: null,
        state: 'SP',
        active: true,
      },
    });

    // Act
    await sut.execute({ clientAddressId: created.id, zipCode });

    // Assert
    const updated = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(updated?.cityCodeIbge).toBe(zipCode);
  });

  it('should not update when zipCode changed since the job was enqueued', async() => {
    // Arrange
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '99999-999',
        street: 'Rua Teste',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: null,
        state: 'SP',
        active: true,
      },
    });

    // Act
    await sut.execute({ clientAddressId: created.id, zipCode: '12345-678' });

    // Assert
    const unchanged = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(unchanged?.cityCodeIbge).toBeNull();
  });

  it('should no-op when address no longer exists', async() => {
    // Act
    await sut.execute({ clientAddressId: 99999, zipCode: '12345-678' });

    // Assert
    const count = await prisma.clientAddress.count();
    expect(count).toBe(0);
  });
});
