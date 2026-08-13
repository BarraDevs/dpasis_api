import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDescriptionTypeModule } from '../../../client-description-type.module';
import { ClientDescriptionTypeInUseError } from '../../../domain/errors/client-description-type-in-use.error';
import { ClientDescriptionTypeNotFoundError } from '../../../domain/errors/client-description-type-not-found.error';
import { DeleteClientDescriptionType } from './delete-client-description-type.service';

describe('DeleteClientDescriptionType - Integration tests', () => {
  let sut: DeleteClientDescriptionType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDescriptionTypeModule],
    }).compile();

    sut = module.get(DeleteClientDescriptionType);
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

  it('should throw ClientDescriptionTypeNotFoundError when client description type does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ClientDescriptionTypeNotFoundError);
  });

  it('should throw ClientDescriptionTypeInUseError when client types use the description type', async() => {
    const [systemType, descriptionType, driveType] = await Promise.all([
      prisma.clientSystemType.create({ data: { name: `Sistema ${Date.now()}`, active: true } }),
      prisma.clientDescriptionType.create({ data: { name: `Descrição ${Date.now()}`, active: true } }),
      prisma.clientDriveType.create({ data: { name: `Drive ${Date.now()}`, active: true } }),
    ]);

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
        generateInvoice: false,
        active: true,
      },
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

    await prisma.clientType.create({
      data: {
        clientId: client.id,
        clientSystemTypeId: systemType.id,
        clientDescriptionTypeId: descriptionType.id,
        clientDriveTypeId: driveType.id,
        clientAddressId: clientAddress.id,
        quantity: 1,
      },
    });

    await expect(sut.execute(descriptionType.id)).rejects.toThrow(ClientDescriptionTypeInUseError);
    await expect(sut.execute(descriptionType.id)).rejects.toThrow(
      'Não é possível excluir pois existem tipos de cliente vinculados.',
    );

    const stillExists = await prisma.clientDescriptionType.findUnique({ where: { id: descriptionType.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete client description type from database', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    await sut.execute(clientDescriptionType.id);

    const deleted = await prisma.clientDescriptionType.findUnique({ where: { id: clientDescriptionType.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientDescriptionType.id);

    expect(result).toEqual({ message: 'Tipo de descrição de cliente excluído com sucesso' });
  });
});
