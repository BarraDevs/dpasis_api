import { Test, TestingModule } from '@nestjs/testing';
import { ClientAddressPersistenceModule } from 'src/app/client/client-address/application/persistence/client-address-persistence.module';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressAlreadyExistsError } from 'src/app/client/client-address/domain/errors/client-address-already-exists.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClientAddress } from './create-client-address.service';

function makeValidInput(overrides?: Record<string, unknown>) {
  return {
    clientId: 1,
    type: ClientAddressType.MAIN,
    zipCode: '12345-678',
    street: 'Rua Teste',
    number: '123',
    complement: null,
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    ...overrides,
  };
}

describe('CreateClientAddress', () => {
  let sut: CreateClientAddress;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, ClientAddressPersistenceModule],
      providers: [CreateClientAddress],
    }).compile();

    sut = module.get(CreateClientAddress);
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

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should create address and return id', async() => {
    const input = makeValidInput({ clientId });

    const result = await sut.execute(input);

    expect(result).toEqual({ id: expect.any(Number) });
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientAddress.findFirst({
      where: { clientId, type: ClientAddressType.MAIN },
    });
    expect(saved).not.toBeNull();
    expect(saved?.id).toBe(result.id);
    expect(saved?.zipCode).toBe('12345-678');
    expect(saved?.street).toBe('Rua Teste');
    expect(saved?.number).toBe('123');
    expect(saved?.neighborhood).toBe('Centro');
    expect(saved?.city).toBe('São Paulo');
    expect(saved?.state).toBe('SP');
  });

  it('should create address with complement', async() => {
    const input = makeValidInput({ clientId, complement: 'Apto 101' });

    const result = await sut.execute(input);

    const saved = await prisma.clientAddress.findFirst({
      where: { id: result.id },
    });
    expect(saved?.complement).toBe('Apto 101');
  });

  it('should create address with null complement', async() => {
    const input = makeValidInput({ clientId, type: ClientAddressType.BILLING, complement: null });

    const result = await sut.execute(input);

    const saved = await prisma.clientAddress.findFirst({
      where: { id: result.id },
    });
    expect(saved?.complement).toBeNull();
  });

  it('should throw ClientAddressAlreadyExistsError when address already exists for client and type', async() => {
    const input = makeValidInput({ clientId });

    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ClientAddressAlreadyExistsError);
    await expect(sut.execute(input)).rejects.toThrow(
      `Endereço do tipo ${ClientAddressType.MAIN} já existe para o cliente ${clientId}.`,
    );
  });

  it('should allow creating same type for different clients', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo Outro ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner Outro ${Date.now()}`, active: true } }),
    ]);

    const otherClient = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '11111111000111',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Outra Empresa',
        fantasyName: null,
        headquarters: 'Rio de Janeiro',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result1 = await sut.execute(makeValidInput({ clientId }));
    const result2 = await sut.execute(makeValidInput({ clientId: otherClient.id }));

    expect(result1.id).not.toBe(result2.id);

    const count = await prisma.clientAddress.count({
      where: { type: ClientAddressType.MAIN },
    });
    expect(count).toBe(2);
  });

  it('should allow creating different types for same client', async() => {
    const mainResult = await sut.execute(makeValidInput({ clientId, type: ClientAddressType.MAIN }));
    const billingResult = await sut.execute(
      makeValidInput({ clientId, type: ClientAddressType.BILLING, zipCode: '98765-432', street: 'Av. Cobrança', number: '2' }),
    );

    expect(mainResult.id).not.toBe(billingResult.id);

    const addresses = await prisma.clientAddress.findMany({
      where: { clientId },
      orderBy: { id: 'asc' },
    });
    expect(addresses).toHaveLength(2);
    expect(addresses[0].type).toBe(ClientAddressType.MAIN);
    expect(addresses[1].type).toBe(ClientAddressType.BILLING);
  });
});
