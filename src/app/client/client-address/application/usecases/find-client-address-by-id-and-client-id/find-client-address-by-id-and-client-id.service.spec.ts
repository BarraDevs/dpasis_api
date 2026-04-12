import { Test } from '@nestjs/testing';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressNotFoundError } from 'src/app/client/client-address/domain/errors/client-address-not-found.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAddressDto } from '../../dtos/client-address.dto';
import { FindClientAddressByIdAndClientId } from './find-client-address-by-id-and-client-id.service';

describe('FindClientAddressByIdAndClientId', () => {
  let sut: FindClientAddressByIdAndClientId;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAddressModule],
    }).compile();

    sut = module.get(FindClientAddressByIdAndClientId);
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
        id: 1,
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

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientAddressNotFoundError when address does not exist', async() => {
    await expect(sut.execute(99999, clientId)).rejects.toThrow(ClientAddressNotFoundError);
    await expect(sut.execute(99999, clientId)).rejects.toThrow('Endereço do cliente não encontrado.');
  });

  it('should throw ClientAddressNotFoundError when address exists but belongs to different client', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo Outro ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner Outro ${Date.now()}`, active: true } }),
    ]);

    const otherClient = await prisma.client.create({
      data: {
        id: 2,
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

    const otherAddress = await prisma.clientAddress.create({
      data: {
        clientId: otherClient.id,
        type: ClientAddressType.MAIN,
        zipCode: '99999-999',
        street: 'Rua Outro Cliente',
        number: '999',
        complement: null,
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        active: true,
      },
    });

    await expect(sut.execute(otherAddress.id, clientId)).rejects.toThrow(ClientAddressNotFoundError);
  });

  it('should return ClientAddressDto when address exists for the given id and clientId', async() => {
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
        active: true,
      },
    });

    const result = await sut.execute(created.id, clientId);

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
      state: 'SP',
      active: true,
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
        active: true,
      },
    });

    const result = await sut.execute(created.id, clientId);

    expect(result.complement).toBeNull();
    expect(result.street).toBe('Av. Principal');
    expect(result.type).toBe(ClientAddressType.BILLING);
  });
});
