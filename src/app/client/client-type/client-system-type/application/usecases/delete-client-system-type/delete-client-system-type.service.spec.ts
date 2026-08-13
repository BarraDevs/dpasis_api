import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { UploadFileQueueFakeAdapterProducer } from 'src/app/upload-file/infra/driven/queue/fake/upload-file-queue-fake.producer';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { ClientSystemTypeModule } from '../../../client-system-type.module';
import { ClientSystemTypeImageUrlSharedError } from '../../../domain/errors/client-system-type-image-url-shared.error';
import { ClientSystemTypeInUseError } from '../../../domain/errors/client-system-type-in-use.error';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import { DeleteClientSystemType } from './delete-client-system-type.service';

describe('DeleteClientSystemType - Integration tests', () => {
  let sut: DeleteClientSystemType;
  let prisma: PrismaService;
  let uploadQueue: UploadFileQueueFakeAdapterProducer;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientSystemTypeModule],
    }).compile();

    sut = module.get(DeleteClientSystemType);
    prisma = module.get(PrismaService);
    uploadQueue = module.get(TOKENS.UploadFileQueueProducer) as UploadFileQueueFakeAdapterProducer;
  });

  beforeEach(async() => {
    await prisma.truncate();
    uploadQueue.addedDeleteJobs.length = 0;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientSystemTypeNotFoundError when client system type does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ClientSystemTypeNotFoundError);
  });

  it('should throw ClientSystemTypeInUseError when client types use the system type', async() => {
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

    await expect(sut.execute(systemType.id)).rejects.toThrow(ClientSystemTypeInUseError);
    await expect(sut.execute(systemType.id)).rejects.toThrow(
      'Não é possível excluir pois existem tipos de cliente vinculados.',
    );

    const stillExists = await prisma.clientSystemType.findUnique({ where: { id: systemType.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete client system type from database', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    await sut.execute(clientSystemType.id);

    const deleted = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
    expect(deleted).toBeNull();
  });

  it('should enqueue delete job when imageUrl exists', async() => {
    const imageUrl = 'https://storage.example.com/bucket/old.png';
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: true, imageUrl },
    });

    await sut.execute(clientSystemType.id);

    expect(uploadQueue.addedDeleteJobs).toHaveLength(1);
    expect(uploadQueue.addedDeleteJobs[0]).toEqual({
      name: JobName.DeleteFile,
      data: { fileUrl: imageUrl },
    });
  });

  it('should throw ClientSystemTypeImageUrlSharedError and not delete when another system type uses the same imageUrl', async() => {
    const sharedUrl = 'https://storage.example.com/bucket/shared.png';
    const ts = Date.now();
    const [first, second] = await Promise.all([
      prisma.clientSystemType.create({
        data: { name: `Sistema A ${ts}`, active: true, imageUrl: sharedUrl },
      }),
      prisma.clientSystemType.create({
        data: { name: `Sistema B ${ts}`, active: true, imageUrl: sharedUrl },
      }),
    ]);

    await expect(sut.execute(first.id)).rejects.toThrow(ClientSystemTypeImageUrlSharedError);

    expect(await prisma.clientSystemType.findUnique({ where: { id: first.id } })).not.toBeNull();
    expect(await prisma.clientSystemType.findUnique({ where: { id: second.id } })).not.toBeNull();
    expect(uploadQueue.addedDeleteJobs).toHaveLength(0);
  });

  it('should return success message', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    const result = await sut.execute(clientSystemType.id);

    expect(result).toEqual({ message: 'Tipo de sistema de cliente excluído com sucesso' });
  });
});
