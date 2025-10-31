import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { AttachmentModule } from 'src/app/attachment/attachment.module';
import { AttachmentNotFoundError } from 'src/app/attachment/domain/errors/attachment-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AttachmentDto } from '../../dtos/attachment.dto';
import { CreateAttachment } from '../create-attachment/create-attachment.service';
import { FindAttachmentById } from '../find-attachment-by-id/find-attachment-by-id.service';
import { EditAttachmentInputDto } from './dtos/edit-attachment.dto';
import { EditAttachment } from './edit-attachment.service';

describe('EditAttachment', () => {
  let sut: EditAttachment;
  let prisma: PrismaService;
  let createAttachment: CreateAttachment;
  let findAttachmentById: FindAttachmentById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AttachmentModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditAttachment);
    prisma = module.get(PrismaService);
    createAttachment = module.get(CreateAttachment);
    findAttachmentById = module.get(FindAttachmentById);

    await prisma.owner.deleteMany();
    await prisma.attachment.deleteMany();
  });

  afterAll(async() => {
    await prisma.owner.deleteMany();
    await prisma.attachment.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call attachmentDao.findById and attachmentDao.edit with correct values', async() => {
      // Arrange
      const id = 'attachment-id-1';
      const attachment = createMock<AttachmentDto>({ id });
      const input = createMock<EditAttachmentInputDto>({ link: 'http://new.link' });
      const findByIdSpy = jest.spyOn(sut['attachmentDao'], 'findById').mockResolvedValue(attachment);
      const editSpy = jest.spyOn(sut['attachmentDao'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id, input);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(editSpy).toHaveBeenCalledWith(id, input);
    });

    it('should throw AttachmentNotFoundError if attachmentDao.findById returns null', async() => {
      // Arrange
      jest.spyOn(sut['attachmentDao'], 'findById').mockResolvedValue(null);
      const id = 'non-existing-id';
      const input = createMock<EditAttachmentInputDto>();

      // Act & Assert
      await expect(sut.execute(id, input)).rejects.toThrow(AttachmentNotFoundError);
    });

    it('should return a success message on successful edit', async() => {
      // Arrange
      const attachment = createMock<AttachmentDto>();
      jest.spyOn(sut['attachmentDao'], 'findById').mockResolvedValue(attachment);
      jest.spyOn(sut['attachmentDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(attachment.id, {}); // Empty edit DTO

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Anexo atualizado com sucesso!' });
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;

    beforeEach(async() => {
      // Create an owner for attachment ownership
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-edit-attachment-test',
        },
      });
    });

    it('should throw AttachmentNotFoundError if attachment does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';
      const data = createMock<EditAttachmentInputDto>();

      // Act & Assert
      await expect(sut.execute(id, data)).rejects.toThrow(AttachmentNotFoundError);
    });

    it('should edit an attachment link', async() => {
      // Arrange
      const createData = {
        link: 'https://original.com/file.txt',
        ownerId: owner01.id,
      };
      const createdAttachment = await createAttachment.execute(createData);

      // Act
      const editData: EditAttachmentInputDto = {
        link: 'https://updated.com/new-file.zip',
      };
      await sut.execute(createdAttachment.id, editData);

      // Assert
      const editedAttachment = await findAttachmentById.execute(createdAttachment.id);
      expect(editedAttachment).toBeDefined();
      expect(editedAttachment.link).toBe(editData.link);
      expect(editedAttachment.ownerId).toBe(createData.ownerId); // Should remain unchanged
    });

    it('should not change ownerId when editing', async() => {
      // Arrange
      const createData = {
        link: 'https://original.com/file.txt',
        ownerId: owner01.id,
      };
      const createdAttachment = await createAttachment.execute(createData);

      const editData: EditAttachmentInputDto = {
        link: 'https://updated.com/new-file.zip',
      };
      await sut.execute(createdAttachment.id, editData);

      // Assert
      const editedAttachment = await findAttachmentById.execute(createdAttachment.id);
      expect(editedAttachment.ownerId).toBe(createData.ownerId); // Verify it hasn't changed
      expect(editedAttachment.link).toBe(editData.link);
    });
  });
});
