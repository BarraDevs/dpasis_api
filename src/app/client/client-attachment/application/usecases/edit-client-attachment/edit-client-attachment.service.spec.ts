import { Test } from '@nestjs/testing';
import { ClientAttachmentModule } from 'src/app/client/client-attachment/client-attachment.module';
import { ClientAttachmentNotFoundError } from 'src/app/client/client-attachment/domain/errors/client-attachment-not-found.error';
import { UploadFileQueueFakeAdapterProducer } from 'src/app/upload-file/infra/driven/queue/fake/upload-file-queue-fake.producer';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditClientAttachmentInputDto } from './dtos/edit-client-attachment.dto';
import { EditClientAttachment } from './edit-client-attachment.service';

function createMockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'new.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 100,
    buffer: Buffer.from('new'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
    ...overrides,
  };
}

describe('EditClientAttachment - Integration tests', () => {
  let sut: EditClientAttachment;
  let prisma: PrismaService;
  let uploadQueue: UploadFileQueueFakeAdapterProducer;

  const createClient = async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);
    return prisma.client.create({
      data: {
        type: 'PJ',
        document: `12345678${Date.now() % 100000}00199`,
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
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

    sut = module.get(EditClientAttachment);
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
    const data: EditClientAttachmentInputDto = { description: 'Nova descrição' };

    await expect(sut.execute(id, data, undefined)).rejects.toThrow(ClientAttachmentNotFoundError);
  });

  it('should update attachment description', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Original',
        link: 'https://original.com',
        active: true,
      },
    });
    const data: EditClientAttachmentInputDto = { description: 'Atualizado' };

    await sut.execute(attachment.id, data, undefined);

    const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
    expect(updated?.description).toBe('Atualizado');
    expect(updated?.link).toBe('https://original.com');
    expect(updated?.active).toBe(true);
  });

  it('should replace link and enqueue delete of old object when file is provided', async() => {
    const client = await createClient();
    const oldUrl = 'https://my-bucket.s3.amazonaws.com/client-attachments/old-uuid-file.pdf';
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Desc',
        link: oldUrl,
        active: true,
      },
    });

    await sut.execute(attachment.id, { description: 'Com arquivo' }, createMockFile());

    const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
    expect(updated?.link).toMatch(/^http:\/\/fake-url\.com\//);
    expect(updated?.description).toBe('Com arquivo');

    expect(uploadQueue.addedDeleteJobs).toHaveLength(1);
    expect(uploadQueue.addedDeleteJobs[0].data.fileUrl).toBe(oldUrl);
  });

  it('should return success message when no file and no body fields (no-op)', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Desc',
        link: 'https://a.com',
        active: true,
      },
    });

    const result = await sut.execute(attachment.id, {}, undefined);

    expect(result).toEqual({ message: 'Anexo do cliente atualizado com sucesso' });
  });

  it('should return success message', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Desc',
        link: 'https://a.com',
        active: true,
      },
    });
    const data: EditClientAttachmentInputDto = { description: 'Nova' };

    const result = await sut.execute(attachment.id, data, undefined);

    expect(result).toEqual({ message: 'Anexo do cliente atualizado com sucesso' });
  });
});
