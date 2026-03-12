import { Test } from '@nestjs/testing';
import { ClientAttachmentModule } from 'src/app/client/client-attachment/client-attachment.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClientAttachment } from './create-client-attachment.service';
import { CreateClientAttachmentInputDto, CreateClientAttachmentOutputDto } from './dtos/create-client-attachment.dto';

describe('CreateClientAttachment - Integration tests', () => {
  let sut: CreateClientAttachment;
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

    sut = module.get(CreateClientAttachment);
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

  it('should create attachment and return id', async() => {
    const client = await createClient();
    const input: CreateClientAttachmentInputDto = {
      clientId: client.id,
      description: 'Contrato de prestação',
      link: 'https://example.com/contract.pdf',
    };

    const result = await sut.execute(input);

    expect(result).toBeDefined();
    expect(result).toMatchObject<CreateClientAttachmentOutputDto>({ id: expect.any(Number) });
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientAttachment.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.clientId).toBe(input.clientId);
    expect(saved?.description).toBe(input.description);
    expect(saved?.link).toBe(input.link);
    expect(saved?.active).toBe(true);
  });

  it('should persist attachment in client_attachments table', async() => {
    const client = await createClient();
    const input: CreateClientAttachmentInputDto = {
      clientId: client.id,
      description: 'Nota fiscal',
      link: 'https://nf.example.com/123.pdf',
    };

    const { id } = await sut.execute(input);

    const attachment = await prisma.clientAttachment.findUnique({ where: { id } });
    expect(attachment).toEqual(
      expect.objectContaining({
        id,
        clientId: input.clientId,
        description: input.description,
        link: input.link,
        active: true,
      }),
    );
    expect(attachment?.createdAt).toBeInstanceOf(Date);
    expect(attachment?.updatedAt).toBeInstanceOf(Date);
  });

  it('should create multiple attachments for same client', async() => {
    const client = await createClient();
    const input1: CreateClientAttachmentInputDto = {
      clientId: client.id,
      description: 'Anexo 1',
      link: 'https://a.com/1',
    };
    const input2: CreateClientAttachmentInputDto = {
      clientId: client.id,
      description: 'Anexo 2',
      link: 'https://a.com/2',
    };

    const result1 = await sut.execute(input1);
    const result2 = await sut.execute(input2);

    expect(result1.id).not.toBe(result2.id);
    const count = await prisma.clientAttachment.count({ where: { clientId: client.id } });
    expect(count).toBe(2);
  });
});
