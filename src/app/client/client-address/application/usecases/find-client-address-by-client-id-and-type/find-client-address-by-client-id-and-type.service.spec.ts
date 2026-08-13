import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAddressDto } from '../../dtos/client-address.dto';
import { FindClientAddressByClientIdAndType } from './find-client-address-by-client-id-and-type.service';

describe('FindClientAddressByClientIdAndType', () => {
  let sut: FindClientAddressByClientIdAndType;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAddressModule],
    }).compile();

    sut = module.get(FindClientAddressByClientIdAndType);
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

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return ClientAddressDto when address exists for the given clientId and type', async() => {
    // Arrange
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    // Act
    const result = await sut.execute(clientId, ClientAddressType.MAIN);

    // Assert
    expect(result).toEqual<ClientAddressDto>({
      id: created.id,
      clientId,
      type: ClientAddressType.MAIN,
      zipCode: '12345-678',
      street: 'Rua Teste',
      number: '123',
      complement: 'Apto 101',
      neighborhood: 'Centro',
      city: 'São Paulo',
      cityCodeIbge: '3550308',
      state: 'SP',
      active: true,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should return null when no address exists for the client', async() => {
    // Act
    const result = await sut.execute(clientId, ClientAddressType.MAIN);

    // Assert
    expect(result).toBeNull();
  });

  it('should return null when client has addresses but not of the requested type', async() => {
    // Arrange
    await prisma.clientAddress.create({
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

    // Act
    const result = await sut.execute(clientId, ClientAddressType.BILLING);

    // Assert
    expect(result).toBeNull();
  });

  it('should return null when address exists for same type but different client', async() => {
    // Arrange
    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo Outro ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);

    const otherClient = await prisma.client.create({
      data: {
        id: 2,
        type: ClientType.PJ,
        document: '11111111000111',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Outra Empresa',
        fantasyName: null,
        headquarters: 'Rio de Janeiro',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await prisma.clientAddress.create({
      data: {
        clientId: otherClient.id,
        type: ClientAddressType.MAIN,
        zipCode: '99999-999',
        street: 'Rua Outro Cliente',
        number: '999',
        complement: null,
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        cityCodeIbge: '3304557',
        state: 'RJ',
        active: true,
      },
    });

    // Act
    const result = await sut.execute(clientId, ClientAddressType.MAIN);

    // Assert
    expect(result).toBeNull();
  });

  it('should return correct address when client has multiple addresses of different types', async() => {
    // Arrange
    await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '11111-111',
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

    const billingAddress = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '22222-222',
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

    // Act
    const result = await sut.execute(clientId, ClientAddressType.BILLING);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.id).toBe(billingAddress.id);
    expect(result?.type).toBe(ClientAddressType.BILLING);
    expect(result?.street).toBe('Rua Cobrança');
  });

  it('should return address with null complement and cityCodeIbge', async() => {
    // Arrange
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '98765-432',
        street: 'Av. Principal',
        number: '456',
        complement: null,
        neighborhood: 'Jardins',
        city: 'Rio de Janeiro',
        cityCodeIbge: null,
        state: 'RJ',
        active: true,
      },
    });

    // Act
    const result = await sut.execute(clientId, ClientAddressType.BILLING);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.id).toBe(created.id);
    expect(result?.complement).toBeNull();
    expect(result?.cityCodeIbge).toBeNull();
    expect(result?.street).toBe('Av. Principal');
    expect(result?.type).toBe(ClientAddressType.BILLING);
  });

  it('should return inactive address when it matches clientId and type', async() => {
    // Arrange
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.SUPPORT,
        zipCode: '33333-333',
        street: 'Rua Inativa',
        number: '3',
        complement: null,
        neighborhood: 'Bairro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: false,
      },
    });

    // Act
    const result = await sut.execute(clientId, ClientAddressType.SUPPORT);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.id).toBe(created.id);
    expect(result?.active).toBe(false);
  });
});
