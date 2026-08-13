import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressNotFoundError } from 'src/app/client/client-address/domain/errors/client-address-not-found.error';
import { ClientDescriptionTypeNotFoundError } from 'src/app/client/client-type/client-description-type/domain/errors/client-description-type-not-found.error';
import { ClientDriveTypeNotFoundError } from 'src/app/client/client-type/client-drive-type/domain/errors/client-drive-type-not-found.error';
import { ClientSystemTypeNotFoundError } from 'src/app/client/client-type/client-system-type/domain/errors/client-system-type-not-found.error';
import { ClientTypeModule } from 'src/app/client/client-type/client-type/client-type.module';
import { ClientTypeNotFoundError } from 'src/app/client/client-type/client-type/domain/errors/client-type-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditClientTypeInputDto } from './dtos/edit-client-type.dto';
import { EditClientType } from './edit-client-type.service';

describe('EditClientType', () => {
  let sut: EditClientType;
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

    sut = module.get(EditClientType);
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
    const data: EditClientTypeInputDto = { quantity: 10 };

    await expect(sut.execute(id, data)).rejects.toThrow(ClientTypeNotFoundError);
  });

  it('should update quantity', async() => {
    const { clientType } = await createClientTypeFixtures();
    const data: EditClientTypeInputDto = { quantity: 10 };

    await sut.execute(clientType.id, data);

    const updated = await prisma.clientType.findUnique({ where: { id: clientType.id } });
    expect(updated?.quantity).toBe(10);
  });

  it('should return success message', async() => {
    const { clientType } = await createClientTypeFixtures();
    const data: EditClientTypeInputDto = { quantity: 15 };

    const result = await sut.execute(clientType.id, data);

    expect(result).toEqual({ message: 'Tipo de cliente atualizado com sucesso' });
  });

  it('should throw ClientSystemTypeNotFoundError when updating to inactive clientSystemType', async() => {
    const { clientType, systemType } = await createClientTypeFixtures();
    const inactiveSystemType = await prisma.clientSystemType.create({
      data: { name: `System Inativo ${Date.now()}-${Math.random()}`, active: false },
    });
    const data: EditClientTypeInputDto = { clientSystemTypeId: inactiveSystemType.id };

    await expect(sut.execute(clientType.id, data)).rejects.toThrow(ClientSystemTypeNotFoundError);

    const updated = await prisma.clientType.findUnique({ where: { id: clientType.id } });
    expect(updated?.clientSystemTypeId).toBe(systemType.id);
  });

  it('should throw ClientDescriptionTypeNotFoundError when updating to inactive clientDescriptionType', async() => {
    const { clientType, descriptionType } = await createClientTypeFixtures();
    const inactiveDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Description Inativo ${Date.now()}-${Math.random()}`, active: false },
    });
    const data: EditClientTypeInputDto = { clientDescriptionTypeId: inactiveDescriptionType.id };

    await expect(sut.execute(clientType.id, data)).rejects.toThrow(ClientDescriptionTypeNotFoundError);

    const updated = await prisma.clientType.findUnique({ where: { id: clientType.id } });
    expect(updated?.clientDescriptionTypeId).toBe(descriptionType.id);
  });

  it('should throw ClientDriveTypeNotFoundError when updating to inactive clientDriveType', async() => {
    const { clientType, driveType } = await createClientTypeFixtures();
    const inactiveDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive Inativo ${Date.now()}-${Math.random()}`, active: false },
    });
    const data: EditClientTypeInputDto = { clientDriveTypeId: inactiveDriveType.id };

    await expect(sut.execute(clientType.id, data)).rejects.toThrow(ClientDriveTypeNotFoundError);

    const updated = await prisma.clientType.findUnique({ where: { id: clientType.id } });
    expect(updated?.clientDriveTypeId).toBe(driveType.id);
  });

  it('should throw ClientAddressNotFoundError when clientAddressId belongs to another client', async() => {
    const { clientType, client, clientAddress } = await createClientTypeFixtures();
    const otherGroup = await prisma.clientGroup.create({
      data: { name: `Grupo outro ${Date.now()}-${Math.random()}`, active: true },
    });
    const otherResale = await prisma.resale.create({
      data: buildMinimalResaleData(nextResaleFixtureId()),
    });
    const otherCompany = await prisma.company.create({ data: buildMinimalCompanyData() });
    const otherClient = await prisma.client.create({
      data: {
        id: 998,
        type: 'PJ',
        document: `88776655${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}00199`,
        ie: null,
        groupId: otherGroup.id,
        resaleId: otherResale.id,
        companyId: otherCompany.id,
        companyName: 'Outra',
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
        zipCode: '30000-000',
        street: 'Rua X',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'BH',
        state: 'MG',
        active: true,
      },
    });

    await expect(sut.execute(clientType.id, { clientAddressId: foreignAddress.id })).rejects.toThrow(
      ClientAddressNotFoundError,
    );

    const updated = await prisma.clientType.findUnique({ where: { id: clientType.id } });
    expect(updated?.clientAddressId).toBe(clientAddress.id);
    expect(client.id).not.toBe(otherClient.id);
  });

  it('should throw ClientAddressNotFoundError when clientAddress is inactive', async() => {
    const { clientType, clientAddress } = await createClientTypeFixtures();

    // inativa o endereço do cliente
    await prisma.clientAddress.update({
      where: { id: clientAddress.id },
      data: { active: false },
    });

    await expect(
      sut.execute(clientType.id, { clientAddressId: clientAddress.id })
    ).rejects.toThrow(ClientAddressNotFoundError);

    // garante que não houve alteração inadvertida:
    const updated = await prisma.clientType.findUnique({ where: { id: clientType.id } });
    expect(updated?.clientAddressId).toBe(clientAddress.id);
    expect(updated?.clientAddressId).toBe(clientAddress.id);
  });
});
