import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAttachmentDto } from 'src/app/client/client-attachment/application/dtos/client-attachment.dto';
import { CreateClientAttachmentInputDto } from 'src/app/client/client-attachment/application/usecases/create-client-attachment/dtos/create-client-attachment.dto';
import { EditClientAttachmentInputDto } from 'src/app/client/client-attachment/application/usecases/edit-client-attachment/dtos/edit-client-attachment.dto';
import { FindAllClientAttachmentQueryDto } from 'src/app/client/client-attachment/application/usecases/find-all-client-attachment/dtos/find-all-client-attachment.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttachmentDaoAdapterPrisma } from './client-attachment-prisma.dao';

describe('ClientAttachmentDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientAttachmentDaoAdapterPrisma;
  let prisma: PrismaService;

  const createClient = async(overrides?: { document?: string; companyName?: string }) => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}-${Math.random()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    return prisma.client.create({
      data: {
        id: 1,
        type: 'PJ',
        document: overrides?.document ?? `12345678${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}00199`,
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: overrides?.companyName ?? 'Empresa Test',
        fantasyName: null,
        headquarters: 'SP',
        invoiceType: 'CONTRACT',
        generateInvoice: true,
        active: true,
      },
    });
  };

  const createTwoClients = async() => {
    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);
    const [client1, client2] = await Promise.all([
      prisma.client.create({
        data: {
          id: 2,
          type: 'PJ',
          document: '11111111000111',
          ie: null,
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 1',
          fantasyName: null,
          headquarters: 'SP',
          invoiceType: 'CONTRACT',
          generateInvoice: true,
          active: true,
        },
      }),
      prisma.client.create({
        data: {
          id: 3,
          type: 'PJ',
          document: '22222222000122',
          ie: null,
          groupId: group.id,
          resaleId: resale.id,
          companyName: 'Empresa 2',
          fantasyName: null,
          headquarters: 'RJ',
          invoiceType: 'CONTRACT',
          generateInvoice: true,
          active: true,
        },
      }),
    ]);
    return [client1, client2] as const;
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientAttachmentDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientAttachmentDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no attachments exist for client', async() => {
      // Arrange
      const client = await createClient();
      const query: FindAllClientAttachmentQueryDto = { clientId: client.id };

      // Act
      const [attachments, total] = await sut.findAll(query);

      // Assert
      expect(attachments).toEqual([]);
      expect(total).toBe(0);
    });

    it('should filter by active when provided', async() => {
      const client = await createClient();
      await prisma.clientAttachment.createMany({
        data: [
          { clientId: client.id, description: 'Anexo Ativo', link: 'https://link1.com', active: true },
          { clientId: client.id, description: 'Anexo Inativo', link: 'https://link2.com', active: false },
        ],
      });

      const [activeAttachments, activeTotal] = await sut.findAll({ clientId: client.id, active: true });
      const [inactiveAttachments, inactiveTotal] = await sut.findAll({ clientId: client.id, active: false });

      expect(activeAttachments).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeAttachments[0].active).toBe(true);
      expect(inactiveAttachments).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveAttachments[0].active).toBe(false);
    });

    it('should return only attachments for the specified clientId', async() => {
      // Arrange
      const [client1, client2] = await createTwoClients();
      await prisma.clientAttachment.createMany({
        data: [
          { clientId: client1.id, description: 'Anexo 1', link: 'https://link1.com', active: true },
          { clientId: client1.id, description: 'Anexo 2', link: 'https://link2.com', active: false },
          { clientId: client2.id, description: 'Anexo 3', link: 'https://link3.com', active: true },
        ],
      });
      const query: FindAllClientAttachmentQueryDto = { clientId: client1.id };

      // Act
      const [attachments, total] = await sut.findAll(query);

      // Assert
      expect(attachments).toHaveLength(2);
      expect(total).toBe(2);
      expect(attachments.every(a => a.clientId === client1.id)).toBe(true);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      const client = await createClient();
      await prisma.clientAttachment.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          clientId: client.id,
          description: `Anexo ${i + 1}`,
          link: `https://link${i + 1}.com`,
          active: true,
        })),
      });

      // Act
      const [attachments, total] = await sut.findAll({ clientId: client.id, page: 1, size: 10 });
      const [attachments2, total2] = await sut.findAll({ clientId: client.id, page: 3, size: 10 });

      // Assert
      expect(attachments).toHaveLength(10);
      expect(total).toBe(25);
      expect(attachments2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in description field (case-insensitive)', async() => {
      // Arrange
      const client = await createClient();
      await prisma.clientAttachment.createMany({
        data: [
          { clientId: client.id, description: 'Contrato de prestação', link: 'https://a.com', active: true },
          { clientId: client.id, description: 'Nota fiscal', link: 'https://b.com', active: true },
        ],
      });
      const query: FindAllClientAttachmentQueryDto = { clientId: client.id, search: 'contrato' };

      // Act
      const [attachments, total] = await sut.findAll(query);

      // Assert
      expect(attachments).toHaveLength(1);
      expect(total).toBe(1);
      expect(attachments[0].description).toBe('Contrato de prestação');
    });

    it('should return results ordered by createdAt desc', async() => {
      // Arrange
      const client = await createClient();
      const att1 = await prisma.clientAttachment.create({
        data: { clientId: client.id, description: 'Primeiro', link: 'https://1.com', active: true },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const att2 = await prisma.clientAttachment.create({
        data: { clientId: client.id, description: 'Segundo', link: 'https://2.com', active: true },
      });
      const query: FindAllClientAttachmentQueryDto = { clientId: client.id };

      // Act
      const [attachments] = await sut.findAll(query);

      // Assert
      expect(attachments).toHaveLength(2);
      expect(attachments[0].id).toBe(att2.id);
      expect(attachments[1].id).toBe(att1.id);
    });

    it('should return all attachment fields correctly', async() => {
      // Arrange
      const client = await createClient();
      const created = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Descrição do anexo',
          link: 'https://example.com/doc.pdf',
          active: true,
        },
      });
      const query: FindAllClientAttachmentQueryDto = { clientId: client.id };

      // Act
      const [attachments] = await sut.findAll(query);

      // Assert
      expect(attachments).toHaveLength(1);
      expect(attachments[0]).toEqual<ClientAttachmentDto>({
        id: created.id,
        clientId: created.clientId,
        description: created.description,
        link: created.link,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when attachment does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return attachment by id', async() => {
      // Arrange
      const client = await createClient();
      const created = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Anexo teste',
          link: 'https://test.com',
          active: false,
        },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.clientId).toBe(client.id);
      expect(result?.description).toBe('Anexo teste');
      expect(result?.link).toBe('https://test.com');
      expect(result?.active).toBe(false);
    });

    it('should return all attachment fields correctly', async() => {
      // Arrange
      const client = await createClient();
      const created = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Descrição completa',
          link: 'https://full.com/doc',
          active: true,
        },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<ClientAttachmentDto>({
        id: created.id,
        clientId: created.clientId,
        description: created.description,
        link: created.link,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('save', () => {
    it('should create attachment and return id', async() => {
      // Arrange
      const client = await createClient();
      const data: CreateClientAttachmentInputDto & { link: string } = {
        clientId: client.id,
        description: 'Novo anexo',
        link: 'https://new.com',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientAttachment.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.clientId).toBe(data.clientId);
      expect(saved?.description).toBe(data.description);
      expect(saved?.link).toBe(data.link);
      expect(saved?.active).toBe(true);
    });

    it('should persist attachment in client_attachments table', async() => {
      // Arrange
      const client = await createClient();
      const data: CreateClientAttachmentInputDto & { link: string } = {
        clientId: client.id,
        description: 'Documento importante',
        link: 'https://doc.com/file.pdf',
      };

      // Act
      const id = await sut.save(data);

      // Assert - verify directly in database table
      const row = await prisma.clientAttachment.findFirst({
        where: { id },
      });
      expect(row).not.toBeNull();
      expect(row?.clientId).toBe(client.id);
      expect(row?.description).toBe('Documento importante');
      expect(row?.link).toBe('https://doc.com/file.pdf');
      expect(row?.active).toBe(true);
      expect(row?.createdAt).toBeDefined();
      expect(row?.updatedAt).toBeDefined();
    });
  });

  describe('edit', () => {
    it('should update attachment description', async() => {
      // Arrange
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

      // Act
      await sut.edit(attachment.id, data);

      // Assert
      const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
      expect(updated?.description).toBe('Atualizado');
      expect(updated?.link).toBe('https://original.com');
      expect(updated?.active).toBe(true);
    });

    it('should update attachment link', async() => {
      // Arrange
      const client = await createClient();
      const attachment = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Desc',
          link: 'https://old.com',
          active: true,
        },
      });
      const data: EditClientAttachmentInputDto & { link: string } = { link: 'https://new.com' };

      // Act
      await sut.edit(attachment.id, data);

      // Assert
      const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
      expect(updated?.description).toBe('Desc');
      expect(updated?.link).toBe('https://new.com');
      expect(updated?.active).toBe(true);
    });

    it('should update multiple fields at once', async() => {
      // Arrange
      const client = await createClient();
      const attachment = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Original',
          link: 'https://old.com',
          active: true,
        },
      });
      const data: EditClientAttachmentInputDto & { link: string } = {
        description: 'Nova descrição',
        link: 'https://new.com',
      };

      // Act
      await sut.edit(attachment.id, data);

      // Assert
      const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
      expect(updated?.description).toBe('Nova descrição');
      expect(updated?.link).toBe('https://new.com');
    });
  });

  describe('countByLinkExcludingId', () => {
    it('should return 0 when no other attachment has the same link', async() => {
      const client = await createClient();
      const attachment = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Único',
          link: 'https://only.com/file.pdf',
          active: true,
        },
      });

      const count = await sut.findByLinkExcludingId(attachment.link, attachment.id);

      expect(count).toBe(0);
    });

    it('should return count of other rows with the same link excluding the given id', async() => {
      const client = await createClient();
      const shared = 'https://shared.com/a.pdf';
      const [a, b] = await Promise.all([
        prisma.clientAttachment.create({
          data: {
            clientId: client.id,
            description: 'A',
            link: shared,
            active: true,
          },
        }),
        prisma.clientAttachment.create({
          data: {
            clientId: client.id,
            description: 'B',
            link: shared,
            active: true,
          },
        }),
      ]);

      expect(await sut.findByLinkExcludingId(shared, a.id)).toBe(1);
      expect(await sut.findByLinkExcludingId(shared, b.id)).toBe(1);
    });

    it('should return count of other rows with the same link excluding the given id (case-insensitive)', async() => {
      const client = await createClient();
      const shared = 'https://SHARED.com/a.pdf';
      const [a, b] = await Promise.all([
        prisma.clientAttachment.create({
          data: {
            clientId: client.id,
            description: 'A',
            link: shared,
            active: true,
          },
        }),
        prisma.clientAttachment.create({
          data: {
            clientId: client.id,
            description: 'B',
            link: shared,
            active: true,
          },
        }),
      ]);

      expect(await sut.findByLinkExcludingId(shared.toUpperCase(), a.id)).toBe(1);
      expect(await sut.findByLinkExcludingId(shared.toLowerCase(), b.id)).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete attachment from database', async() => {
      // Arrange
      const client = await createClient();
      const attachment = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Para deletar',
          link: 'https://del.com',
          active: true,
        },
      });

      // Act
      await sut.delete(attachment.id);

      // Assert
      const deleted = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
      expect(deleted).toBeNull();
    });

    it('should remove row from client_attachments table', async() => {
      // Arrange
      const client = await createClient();
      const attachment = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Anexo',
          link: 'https://a.com',
          active: true,
        },
      });
      const countBefore = await prisma.clientAttachment.count();

      // Act
      await sut.delete(attachment.id);

      // Assert
      const countAfter = await prisma.clientAttachment.count();
      expect(countAfter).toBe(countBefore - 1);
      const found = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
      expect(found).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update attachment active status from true to false', async() => {
      // Arrange
      const client = await createClient();
      const attachment = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Anexo',
          link: 'https://a.com',
          active: true,
        },
      });

      // Act
      await sut.updateStatus(attachment.id, false);

      // Assert
      const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
      expect(updated?.active).toBe(false);
    });

    it('should update attachment active status from false to true', async() => {
      // Arrange
      const client = await createClient();
      const attachment = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Anexo',
          link: 'https://a.com',
          active: false,
        },
      });

      // Act
      await sut.updateStatus(attachment.id, true);

      // Assert
      const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
      expect(updated?.active).toBe(true);
    });

    it('should only update active field, preserving other fields', async() => {
      // Arrange
      const client = await createClient();
      const attachment = await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: 'Descrição preservada',
          link: 'https://preserved.com',
          active: true,
        },
      });

      // Act
      await sut.updateStatus(attachment.id, false);

      // Assert
      const updated = await prisma.clientAttachment.findUnique({ where: { id: attachment.id } });
      expect(updated?.active).toBe(false);
      expect(updated?.description).toBe('Descrição preservada');
      expect(updated?.link).toBe('https://preserved.com');
      expect(updated?.clientId).toBe(client.id);
    });
  });
});
