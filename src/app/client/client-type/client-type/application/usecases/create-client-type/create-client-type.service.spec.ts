import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressNotFoundError } from 'src/app/client/client-address/domain/errors/client-address-not-found.error';
import { ClientDescriptionTypeNotFoundError } from 'src/app/client/client-type/client-description-type/domain/errors/client-description-type-not-found.error';
import { ClientDriveTypeNotFoundError } from 'src/app/client/client-type/client-drive-type/domain/errors/client-drive-type-not-found.error';
import { ClientSystemTypeNotFoundError } from 'src/app/client/client-type/client-system-type/domain/errors/client-system-type-not-found.error';
import { ClientTypeModule } from 'src/app/client/client-type/client-type/client-type.module';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClientType } from './create-client-type.service';
import { CreateClientTypeInputDto, CreateClientTypeOutputDto } from './dtos/create-client-type.dto';

describe('CreateClientType', () => {
  let sut: CreateClientType;
  let prisma: PrismaService;

  const createClientTypeFixtures = async() => {
    const group = await prisma.clientGroup.create({
      data: { name: `Grupo ${Date.now()}-${Math.random()}`, active: true },
    });
    const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
    const client = await prisma.client.create({
      data: {
        id: 1,
        type: 'PJ',
        document: `12345678${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}00199`,
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'SP',
        invoiceType: 'CONTRACT',
        generateInvoice: true,
        active: true,
      },
    });
    const systemType = await prisma.clientSystemType.create({
      data: { name: `Sistema ${Date.now()}-${Math.random()}`, active: true },
    });
    const descriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Descrição ${Date.now()}-${Math.random()}`, active: true },
    });
    const driveType = await prisma.clientDriveType.create({
      data: { name: `Drive ${Date.now()}-${Math.random()}`, active: true },
    });
    const clientAddress = await prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.MAIN,
        zipCode: '01310-100',
        street: 'Av. Teste',
        number: '100',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        active: true,
      },
    });
    const data: CreateClientTypeInputDto = {
      clientId: client.id,
      clientSystemTypeId: systemType.id,
      clientDescriptionTypeId: descriptionType.id,
      clientDriveTypeId: driveType.id,
      clientAddressId: clientAddress.id,
      quantity: 5,
    };
    return { client, data };
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientTypeModule],
    }).compile();

    sut = module.get(CreateClientType);
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

  it('should create client type and return id', async() => {
    const { data } = await createClientTypeFixtures();

    const result = await sut.execute(data);

    expect(result).toBeDefined();
    expect(result).toMatchObject<CreateClientTypeOutputDto>({ id: expect.any(Number) });
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientType.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.clientId).toBe(data.clientId);
    expect(saved?.quantity).toBe(data.quantity);
    expect(saved?.active).toBe(true);
  });

  it('should persist in client_types table', async() => {
    const { data } = await createClientTypeFixtures();

    const { id } = await sut.execute(data);

    const row = await prisma.clientType.findUnique({ where: { id } });
    expect(row).toEqual(
      expect.objectContaining({
        id,
        clientId: data.clientId,
        quantity: data.quantity,
        active: true,
      }),
    );
    expect(row?.createdAt).toBeInstanceOf(Date);
    expect(row?.updatedAt).toBeInstanceOf(Date);
  });

  it('should create multiple client types for same client', async() => {
    const { data } = await createClientTypeFixtures();

    const result1 = await sut.execute(data);
    const result2 = await sut.execute(data);

    expect(result1.id).not.toBe(result2.id);
    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(2);
  });

  it('should throw ClientNotFoundError when client is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.client.update({
      where: { id: data.clientId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });

  it('should throw ClientSystemTypeNotFoundError when clientSystemType is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.clientSystemType.update({
      where: { id: data.clientSystemTypeId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientSystemTypeNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });

  it('should throw ClientDescriptionTypeNotFoundError when clientDescriptionType is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.clientDescriptionType.update({
      where: { id: data.clientDescriptionTypeId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientDescriptionTypeNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });

  it('should throw ClientAddressNotFoundError when clientAddressId does not belong to client', async() => {
    const { data } = await createClientTypeFixtures();
    const otherClientGroup = await prisma.clientGroup.create({
      data: { name: `Grupo outro ${Date.now()}-${Math.random()}`, active: true },
    });
    const otherResale = await prisma.resale.create({
      data: buildMinimalResaleData(nextResaleFixtureId()),
    });
    const otherClient = await prisma.client.create({
      data: {
        id: 999,
        type: 'PJ',
        document: `99887766${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}00199`,
        ie: null,
        groupId: otherClientGroup.id,
        resaleId: otherResale.id,
        companyName: 'Outra Empresa',
        fantasyName: null,
        headquarters: 'SP',
        invoiceType: 'CONTRACT',
        generateInvoice: true,
        active: true,
      },
    });
    const foreignAddress = await prisma.clientAddress.create({
      data: {
        clientId: otherClient.id,
        type: ClientAddressType.BILLING,
        zipCode: '30130-100',
        street: 'Rua Outra',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'BH',
        state: 'MG',
        active: true,
      },
    });

    await expect(
      sut.execute({ ...data, clientAddressId: foreignAddress.id }),
    ).rejects.toThrow(ClientAddressNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });

  it('should throw ClientAddressNotFoundError when clientAddress is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.clientAddress.update({
      where: { id: data.clientAddressId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientAddressNotFoundError);
  });

  it('should throw ClientDriveTypeNotFoundError when clientDriveType is inactive', async() => {
    const { data } = await createClientTypeFixtures();
    await prisma.clientDriveType.update({
      where: { id: data.clientDriveTypeId },
      data: { active: false },
    });

    await expect(sut.execute(data)).rejects.toThrow(ClientDriveTypeNotFoundError);

    const count = await prisma.clientType.count({ where: { clientId: data.clientId } });
    expect(count).toBe(0);
  });
});
