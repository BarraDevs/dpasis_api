import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientTypeModule } from 'src/app/client/client-type/client-type/client-type.module';
import { ClientTypeNotFoundError } from 'src/app/client/client-type/client-type/domain/errors/client-type-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { UpdateClientTypeStatus } from './update-client-type-status.service';

describe('UpdateClientTypeStatus', () => {
  let sut: UpdateClientTypeStatus;
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
        cityCodeIbge: '3550308',
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
    return { client, clientType };
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientTypeModule],
    }).compile();

    sut = module.get(UpdateClientTypeStatus);
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

  it('should invert active status from true to false', async() => {
    const { clientType } = await createClientTypeFixtures();

    await sut.execute(clientType.id);

    const updated = await prisma.clientType.findUnique({ where: { id: clientType.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active status from false to true', async() => {
    const { clientType } = await createClientTypeFixtures();
    await prisma.clientType.update({
      where: { id: clientType.id },
      data: { active: false },
    });

    await sut.execute(clientType.id);

    const updated = await prisma.clientType.findUnique({ where: { id: clientType.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const { clientType } = await createClientTypeFixtures();

    const result = await sut.execute(clientType.id);

    expect(result).toEqual({ message: 'Status do tipo de cliente atualizado com sucesso' });
  });
});
