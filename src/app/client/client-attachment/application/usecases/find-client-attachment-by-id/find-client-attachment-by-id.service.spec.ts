import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAttachmentDto } from 'src/app/client/client-attachment/application/dtos/client-attachment.dto';
import { ClientAttachmentModule } from 'src/app/client/client-attachment/client-attachment.module';
import { ClientAttachmentNotFoundError } from 'src/app/client/client-attachment/domain/errors/client-attachment-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindClientAttachmentById } from './find-client-attachment-by-id.service';

describe('FindClientAttachmentById - Integration tests', () => {
  let sut: FindClientAttachmentById;
  let prisma: PrismaService;

  const createClient = async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    return prisma.client.create({
      data: {
        id: 1,
        type: 'PJ',
        document: `12345678${Date.now() % 100000}00199`,
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
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttachmentModule],
    }).compile();

    sut = module.get(FindClientAttachmentById);
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

  it('should throw ClientAttachmentNotFoundError when attachment does not exist', async() => {
    const id = 0;

    await expect(sut.execute(id)).rejects.toThrow(ClientAttachmentNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow(
      'Anexo do cliente não encontrado na base de dados.',
    );
  });

  it('should return attachment by id', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Contrato de prestação',
        link: 'https://example.com/contract.pdf',
        active: true,
      },
    });

    const result = await sut.execute(attachment.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(attachment.id);
    expect(result.clientId).toBe(client.id);
    expect(result.description).toBe('Contrato de prestação');
    expect(result.link).toBe('https://example.com/contract.pdf');
    expect(result.active).toBe(true);
  });

  it('should return all attachment fields correctly', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Test',
        link: 'https://test.com',
        active: false,
      },
    });

    const result = await sut.execute(attachment.id);

    expect(result).toEqual<ClientAttachmentDto>({
      id: attachment.id,
      clientId: attachment.clientId,
      description: attachment.description,
      link: attachment.link,
      active: attachment.active,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    });
  });
});
