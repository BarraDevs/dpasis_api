import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAttachmentModule } from 'src/app/client/client-attachment/client-attachment.module';
import { ClientAttachmentLinkSharedError } from 'src/app/client/client-attachment/domain/errors/client-attachment-link-shared.error';
import { ClientAttachmentNotFoundError } from 'src/app/client/client-attachment/domain/errors/client-attachment-not-found.error';
import { UploadFileQueueFakeAdapterProducer } from 'src/app/upload-file/infra/driven/queue/fake/upload-file-queue-fake.producer';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteClientAttachment } from './delete-client-attachment.service';

describe('DeleteClientAttachment - Integration tests', () => {
  let sut: DeleteClientAttachment;
  let prisma: PrismaService;
  let uploadQueue: UploadFileQueueFakeAdapterProducer;

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

    sut = module.get(DeleteClientAttachment);
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

  it('should throw ClientAttachmentNotFoundError when attachment does not exist', async() => {
    const id = 0;

    await expect(sut.execute(id)).rejects.toThrow(ClientAttachmentNotFoundError);
  });

  it('should delete attachment from database', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Para deletar',
        link: 'https://del.com/path/file.pdf',
        active: true,
      },
    });

    await sut.execute(attachment.id);

    const deleted = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
    expect(deleted).toBeNull();
  });

  it('should enqueue delete job with S3 key from link', async() => {
    const client = await createClient();
    const link = 'https://bucket.s3.amazonaws.com/client-attachments/uuid-name.pdf';
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Desc',
        link,
        active: true,
      },
    });

    await sut.execute(attachment.id);

    expect(uploadQueue.addedDeleteJobs).toHaveLength(1);
    expect(uploadQueue.addedDeleteJobs[0].data.fileUrl).toBe(link);
  });

  it('should return success message', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Desc',
        link: 'https://a.com/x/y.pdf',
        active: true,
      },
    });

    const result = await sut.execute(attachment.id);

    expect(result).toEqual({ message: 'Anexo do cliente excluído com sucesso' });
  });

  it('should throw ClientAttachmentLinkSharedError and not delete when another attachment uses the same link', async() => {
    const client = await createClient();
    const sharedLink = 'https://bucket.s3.amazonaws.com/shared/file.pdf';
    const [first, second] = await Promise.all([
      prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Primeiro',
          link: sharedLink,
          active: true,
        },
      }),
      prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Segundo',
          link: sharedLink,
          active: true,
        },
      }),
    ]);

    await expect(sut.execute(first.id)).rejects.toThrow(ClientAttachmentLinkSharedError);

    expect(await prisma.clientAttachment.findUnique({ where: { id: first.id } })).not.toBeNull();
    expect(await prisma.clientAttachment.findUnique({ where: { id: second.id } })).not.toBeNull();
    expect(uploadQueue.addedDeleteJobs).toHaveLength(0);
  });
});
