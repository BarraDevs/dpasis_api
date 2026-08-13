import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientTypeModule } from 'src/app/client/client-type/client-type/client-type.module';
import { ClientTypeNotFoundError } from 'src/app/client/client-type/client-type/domain/errors/client-type-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientTypeDto } from '../../dtos/client-type.dto';
import { FindClientTypeById } from './find-client-type-by-id.service';

describe('FindClientTypeById', () => {
  let sut: FindClientTypeById;
  let prisma: PrismaService;

  const createClientTypeFixtures = async() => {
    const group = await prisma.clientGroup.create({
      data: { name: `Grupo ${Date.now()}-${Math.random()}`, active: true },
    });
    const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const client = await prisma.client.create({
      data: {
        id: 1,
        type: 'PJ',
        document: `12345678${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}00199`,
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
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
    const clientType = await prisma.clientType.create({
      data: {
        clientId: client.id,
        clientSystemTypeId: systemType.id,
        clientDescriptionTypeId: descriptionType.id,
        clientDriveTypeId: driveType.id,
        clientAddressId: clientAddress.id,
        quantity: 5,
        active: true,
      },
    });
    return {
      client,
      clientType,
      systemType,
      descriptionType,
      driveType,
      clientAddress,
    };
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientTypeModule],
    }).compile();

    sut = module.get(FindClientTypeById);
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

  it('should throw ClientTypeNotFoundError when client type does not exist', async() => {
    const id = 0;

    await expect(sut.execute(id)).rejects.toThrow(ClientTypeNotFoundError);
  });

  it('should return client type by id with expanded relations', async() => {
    const {
      client,
      clientType,
      systemType,
      descriptionType,
      driveType,
      clientAddress,
    } = await createClientTypeFixtures();

    const result = await sut.execute(clientType.id);

    expect(result).toBeDefined();
    expect(result).toEqual<ClientTypeDto>({
      id: clientType.id,
      clientId: client.id,
      quantity: clientType.quantity,
      active: clientType.active,
      clientSystemType: { id: systemType.id, name: systemType.name },
      clientDriveType: { id: driveType.id, name: driveType.name },
      clientDescriptionType: { id: descriptionType.id, name: descriptionType.name },
      clientAddress: {
        id: clientAddress.id,
        type: ClientAddressType.MAIN,
        city: 'São Paulo',
        cityCodeIbge: null,
        state: 'SP',
      },
      createdAt: clientType.createdAt,
      updatedAt: clientType.updatedAt,
    });
  });

  it('should return client type when onlyActive: true and client type is active', async() => {
    const { clientType } = await createClientTypeFixtures();

    const result = await sut.execute(clientType.id, { onlyActive: true });

    expect(result).toBeDefined();
    expect(result.id).toBe(clientType.id);
    expect(result.active).toBe(true);
  });

  it('should throw ClientTypeNotFoundError when onlyActive: true and client type is inactive', async() => {
    const { clientType } = await createClientTypeFixtures();
    await prisma.clientType.update({
      where: { id: clientType.id },
      data: { active: false },
    });

    await expect(sut.execute(clientType.id, { onlyActive: true })).rejects.toThrow(ClientTypeNotFoundError);
  });
});
