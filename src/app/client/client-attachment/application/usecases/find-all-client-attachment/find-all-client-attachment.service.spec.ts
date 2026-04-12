import { Test } from '@nestjs/testing';
import { ClientAttachmentDto } from 'src/app/client/client-attachment/application/dtos/client-attachment.dto';
import { ClientAttachmentModule } from 'src/app/client/client-attachment/client-attachment.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindAllClientAttachmentQueryDto } from './dtos/find-all-client-attachment.dto';
import { FindAllClientAttachment } from './find-all-client-attachment.service';

describe('FindAllClientAttachment - Integration tests', () => {
  let sut: FindAllClientAttachment;
  let prisma: PrismaService;

  const createClient = async(id = 1) => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);
    return prisma.client.create({
      data: {
        id,
        type: 'PJ',
        document: `12345678${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}00199`,
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

    sut = module.get(FindAllClientAttachment);
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

  it('should return empty results when no attachments exist for client', async() => {
    const client = await createClient();
    const query: FindAllClientAttachmentQueryDto = { clientId: client.id };

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all attachments with pagination', async() => {
    const client = await createClient();
    await prisma.clientAttachment.createMany({
      data: [
        { clientId: client.id, description: 'Anexo 1', link: 'https://1.com', active: true },
        { clientId: client.id, description: 'Anexo 2', link: 'https://2.com', active: true },
        { clientId: client.id, description: 'Anexo 3', link: 'https://3.com', active: true },
      ],
    });

    const result = await sut.execute({ clientId: client.id, page: 1, size: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    const client = await createClient();
    await prisma.clientAttachment.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        clientId: client.id,
        description: `Anexo ${i + 1}`,
        link: `https://${i + 1}.com`,
        active: true,
      })),
    });

    const page1 = await sut.execute({ clientId: client.id, page: 1, size: 10 });
    const page3 = await sut.execute({ clientId: client.id, page: 3, size: 10 });

    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should filter by active when active is true', async() => {
    const client = await createClient();
    await prisma.clientAttachment.createMany({
      data: [
        { clientId: client.id, description: 'A1', link: 'https://1.com', active: true },
        { clientId: client.id, description: 'A2', link: 'https://2.com', active: false },
        { clientId: client.id, description: 'A3', link: 'https://3.com', active: true },
      ],
    });

    const result = await sut.execute({ clientId: client.id, page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((a: ClientAttachmentDto) => a.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    const client = await createClient();
    await prisma.clientAttachment.createMany({
      data: [
        { clientId: client.id, description: 'A1', link: 'https://1.com', active: true },
        { clientId: client.id, description: 'A2', link: 'https://2.com', active: false },
        { clientId: client.id, description: 'A3', link: 'https://3.com', active: false },
      ],
    });

    const result = await sut.execute({ clientId: client.id, page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((a: ClientAttachmentDto) => !a.active)).toBe(true);
  });

  it('should filter by clientId', async() => {
    const client1 = await createClient();
    const client2 = await createClient(2);
    await prisma.clientAttachment.createMany({
      data: [
        { clientId: client1.id, description: 'A1', link: 'https://1.com', active: true },
        { clientId: client1.id, description: 'A2', link: 'https://2.com', active: true },
        { clientId: client2.id, description: 'A3', link: 'https://3.com', active: true },
      ],
    });

    const result = await sut.execute({ clientId: client1.id, page: 1, size: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((a: ClientAttachmentDto) => a.clientId === client1.id)).toBe(true);
  });

  it('should filter by search in description', async() => {
    const client = await createClient();
    await prisma.clientAttachment.createMany({
      data: [
        { clientId: client.id, description: 'Contrato de prestação', link: 'https://1.com', active: true },
        { clientId: client.id, description: 'Nota fiscal', link: 'https://2.com', active: true },
        { clientId: client.id, description: 'Contrato de compra', link: 'https://3.com', active: true },
      ],
    });

    const result = await sut.execute({
      clientId: client.id,
      page: 1,
      size: 10,
      search: 'contrato',
    });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((a: ClientAttachmentDto) =>
      a.description.toLowerCase().includes('contrato'),
    )).toBe(true);
  });

  it('should order by createdAt desc', async() => {
    const client = await createClient();
    const first = await prisma.clientAttachment.create({
      data: { clientId: client.id, description: 'Primeiro', link: 'https://1.com', active: true },
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    const second = await prisma.clientAttachment.create({
      data: { clientId: client.id, description: 'Segundo', link: 'https://2.com', active: true },
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    const third = await prisma.clientAttachment.create({
      data: { clientId: client.id, description: 'Terceiro', link: 'https://3.com', active: true },
    });

    const result = await sut.execute({ clientId: client.id, page: 1, size: 10 });

    expect(result.data[0].id).toBe(third.id);
    expect(result.data[1].id).toBe(second.id);
    expect(result.data[2].id).toBe(first.id);
  });

  it('should return correct ClientAttachmentDto structure', async() => {
    const client = await createClient();
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: client.id,
        description: 'Test',
        link: 'https://test.com',
        active: true,
      },
    });

    const result = await sut.execute({ clientId: client.id, page: 1, size: 10 });

    expect(result.data[0]).toEqual<ClientAttachmentDto>({
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
