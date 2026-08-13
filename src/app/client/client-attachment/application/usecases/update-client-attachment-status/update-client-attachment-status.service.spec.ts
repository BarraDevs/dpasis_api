import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { ClientAttachmentModule } from 'src/app/client/client-attachment/client-attachment.module';
import { ClientAttachmentNotFoundError } from 'src/app/client/client-attachment/domain/errors/client-attachment-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { UpdateClientAttachmentStatus } from './update-client-attachment-status.service';

describe('UpdateClientAttachmentStatus - Integration tests', () => {
  let sut: UpdateClientAttachmentStatus;
  let prisma: PrismaService;

  const createClient = async() => {
    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);
    return prisma.client.create({
      data: {
        id: 1,
        type: 'PJ',
        document: `12345678${Date.now() % 100000}00199`,
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
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttachmentModule],
    }).compile();

    sut = module.get(UpdateClientAttachmentStatus);
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
  });

  it('should invert active from true to false', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Anexo',
        link: 'https://a.com',
        active: true,
      },
    });

    await sut.execute(attachment.id);

    const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Anexo',
        link: 'https://a.com',
        active: false,
      },
    });

    await sut.execute(attachment.id);

    const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Anexo',
        link: 'https://a.com',
        active: true,
      },
    });

    const result = await sut.execute(attachment.id);

    expect(result).toEqual({ message: 'Status do anexo do cliente atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Descrição preservada',
        link: 'https://preserved.com',
        active: true,
      },
    });

    await sut.execute(attachment.id);

    const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
    expect(updated?.description).toBe('Descrição preservada');
    expect(updated?.link).toBe('https://preserved.com');
    expect(updated?.clientId).toBe(client.id);
    expect(updated?.active).toBe(false);
  });
});
