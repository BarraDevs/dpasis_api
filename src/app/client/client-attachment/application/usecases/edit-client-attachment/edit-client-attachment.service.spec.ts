import { Test } from '@nestjs/testing';
import { ClientAttachmentModule } from 'src/app/client/client-attachment/client-attachment.module';
import { ClientAttachmentNotFoundError } from 'src/app/client/client-attachment/domain/errors/client-attachment-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditClientAttachmentInputDto } from './dtos/edit-client-attachment.dto';
import { EditClientAttachment } from './edit-client-attachment.service';

describe('EditClientAttachment - Integration tests', () => {
  let sut: EditClientAttachment;
  let prisma: PrismaService;

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
    const data: EditClientAttachmentInputDto = { description: 'Nova descrição' };

    await expect(sut.execute(id, data)).rejects.toThrow(ClientAttachmentNotFoundError);
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

    await sut.execute(attachment.id, data);

    const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
    expect(updated?.description).toBe('Atualizado');
    expect(updated?.link).toBe('https://original.com');
    expect(updated?.active).toBe(true);
  });

  it('should update attachment link', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Desc',
        link: 'https://old.com',
        active: true,
      },
    });
    const data: EditClientAttachmentInputDto = { link: 'https://new.com' };

    await sut.execute(attachment.id, data);

    const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
    expect(updated?.description).toBe('Desc');
    expect(updated?.link).toBe('https://new.com');
  });

  it('should update both description and link', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Original',
        link: 'https://old.com',
        active: true,
      },
    });
    const data: EditClientAttachmentInputDto = {
      description: 'Nova descrição',
      link: 'https://new.com',
    };

    await sut.execute(attachment.id, data);

    const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
    expect(updated?.description).toBe('Nova descrição');
    expect(updated?.link).toBe('https://new.com');
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

    const result = await sut.execute(attachment.id, data);

    expect(result).toEqual({ message: 'Anexo do cliente atualizado com sucesso' });
  });
});
