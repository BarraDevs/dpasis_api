import { Test, TestingModule } from '@nestjs/testing';
import { ClientAddressPersistenceModule } from 'src/app/client/client-address/application/persistence/client-address-persistence.module';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressNotFoundError } from 'src/app/client/client-address/domain/errors/client-address-not-found.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindClientAddressById } from './find-client-address-by-id.service';

describe('FindClientAddressById', () => {
  let sut: FindClientAddressById;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, ClientAddressPersistenceModule],
      providers: [FindClientAddressById],
    }).compile();

    sut = module.get(FindClientAddressById);
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

  it('should throw ClientAddressNotFoundError when address does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ClientAddressNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('ClientAddress não encontrado.');
  });

  it('should return ClientAddressDto when address exists', async() => {
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
        state: 'SP',
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({
      id: created.id,
      type: ClientAddressType.MAIN,
      zipCode: '12345-678',
      street: 'Rua Teste',
      number: '123',
      complement: 'Apto 101',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should return address with null complement', async() => {
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
        state: 'RJ',
      },
    });

    const result = await sut.execute(created.id);

    expect(result.complement).toBeNull();
    expect(result.street).toBe('Av. Principal');
    expect(result.type).toBe(ClientAddressType.BILLING);
  });
});
