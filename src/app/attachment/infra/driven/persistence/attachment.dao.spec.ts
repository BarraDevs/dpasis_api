import { Test } from '@nestjs/testing';
import { AttachmentPersistenceModule } from 'src/app/attachment/application/persistence/attachment-persistence.module';
import { CreateAttachmentInputDto } from 'src/app/attachment/application/usecases/create-attachment/dtos/create-attachment.dto';
import { EditAttachmentInputDto } from 'src/app/attachment/application/usecases/edit-attachment/dtos/edit-attachment.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AttachmentDaoAdapterPrisma } from './attachment.dao'; // Ajuste no import

describe('AttachmentDaoAdapterPrisma', () => {
  let sut: AttachmentDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AttachmentPersistenceModule,
        ConfigModule,
      ],
      providers: [
        AttachmentDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(AttachmentDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.attachment.deleteMany(); // Limpa a tabela de attachments
  });

  afterAll(async() => {
    await prisma.attachment.deleteMany(); // Limpa a tabela de attachments
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('save', () => {
    it('should save an attachment and return its id', async() => {
      // Arrange
      const data: CreateAttachmentInputDto = {
        link: 'http://example.com/file1.pdf',
        ownerId: 'owner-save-test',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toEqual(expect.any(String));
      const savedAttachment = await prisma.attachment.findUnique({ where: { id } });
      expect(savedAttachment).toBeDefined();
      expect(savedAttachment?.link).toBe(data.link);
      expect(savedAttachment?.ownerId).toBe(data.ownerId);
    });
  });

  describe('findAll', () => {
    const owner1 = 'owner-findall-1';
    const owner2 = 'owner-findall-2';

    beforeEach(async() => {
      // Seed data for findAll tests
      await prisma.attachment.createMany({
        data: [
          { link: 'file_a.txt', ownerId: owner1 },
          { link: 'image_b.jpg', ownerId: owner2 },
          { link: 'document_c.pdf', ownerId: owner1 },
          { link: 'archive_d.zip', ownerId: owner1 },
          { link: 'another_image_e.png', ownerId: owner2 },
          { link: 'report_f.PDF', ownerId: owner1 }, // Case test
        ],
      });
    });

    it('should return all attachments for a specific owner', async() => {
      // Act
      const [attachments, total] = await sut.findAll({ ownerId: owner1 });

      // Assert
      expect(total).toBe(4);
      expect(attachments).toHaveLength(4);
      expect(attachments.every(a => a.ownerId === owner1)).toBe(true);
    });

    it('should return paginated attachments for a specific owner', async() => {
      // Act
      const [attachments, total] = await sut.findAll({ ownerId: owner1, page: 2, size: 2 });

      // Assert
      expect(total).toBe(4);
      expect(attachments).toHaveLength(2);
      // Further assertions depend on the default ordering (createdAt desc)
    });

    it('should filter attachments by search term (link) and ownerId', async() => {
      // Act
      const [attachments, total] = await sut.findAll({ ownerId: owner1, search: '.pdf' });

      // Assert
      expect(total).toBe(2); // document_c.pdf, report_f.PDF
      expect(attachments).toHaveLength(2);
      expect(attachments.every(a => a.link.toLowerCase().includes('.pdf'))).toBe(true);
    });

    it('should return empty if ownerId has no attachments', async() => {
      // Act
      const [attachments, total] = await sut.findAll({ ownerId: 'non-existing-owner' });

      // Assert
      expect(total).toBe(0);
      expect(attachments).toHaveLength(0);
    });

    it('should return empty if search term matches nothing for the owner', async() => {
      // Act
      const [attachments, total] = await sut.findAll({ ownerId: owner1, search: '.xlsx' });

      // Assert
      expect(total).toBe(0);
      expect(attachments).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return null if attachment not found', async() => {
      // Act
      const attachment = await sut.findById('non-existing-id');

      // Assert
      expect(attachment).toBeNull();
    });

    it('should return the correct attachment if found', async() => {
      // Arrange
      const created = await prisma.attachment.create({
        data: { link: 'findme.png', ownerId: 'find-owner' },
      });

      // Act
      const attachment = await sut.findById(created.id);

      // Assert
      expect(attachment).not.toBeNull();
      expect(attachment?.id).toBe(created.id);
      expect(attachment?.link).toBe('findme.png');
    });
  });

  describe('edit', () => {
    it('should update the attachment link', async() => {
      // Arrange
      const created = await prisma.attachment.create({
        data: { link: 'old-link.gif', ownerId: 'edit-owner' },
      });
      const editData: EditAttachmentInputDto = {
        link: 'new-link.webp',
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedAttachment = await prisma.attachment.findUnique({ where: { id: created.id } });
      expect(updatedAttachment).toBeDefined();
      expect(updatedAttachment?.link).toBe(editData.link);
      expect(updatedAttachment?.ownerId).toBe('edit-owner'); // Unchanged
    });

    it('should not throw error if attachment does not exist (Prisma handles this)', async() => {
      // Arrange
      const editData: EditAttachmentInputDto = { link: 'no-effect.jpg' };

      // Act & Assert
      await expect(sut.edit('non-existing-id', editData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete the attachment', async() => {
      // Arrange
      const created = await prisma.attachment.create({
        data: { link: 'delete-me.tmp', ownerId: 'delete-owner' },
      });

      // Act
      await sut.delete(created.id);

      // Assert
      const deletedAttachment = await prisma.attachment.findUnique({ where: { id: created.id } });
      expect(deletedAttachment).toBeNull();
    });

    it('should not throw error if attachment does not exist (Prisma handles this)', async() => {
      // Act & Assert
      await expect(sut.delete('non-existing-id')).rejects.toThrow();
    });
  });

});
