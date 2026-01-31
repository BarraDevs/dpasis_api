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
import { DeleteAttachment } from './delete-attachment.service';

describe('DeleteAttachment', () => {
  let sut: DeleteAttachment;
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

    sut = module.get(DeleteAttachment);
    prisma = module.get(PrismaService);
    createAttachment = module.get(CreateAttachment);
    findAttachmentById = module.get(FindAttachmentById);

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call attachmentDao.findById and attachmentDao.delete with correct values', async() => {
      // Arrange
      const id = 'attachment-id-to-delete';
      const attachment = createMock<AttachmentDto>({ id });
      const findByIdSpy = jest.spyOn(sut['attachmentDao'], 'findById').mockResolvedValue(attachment);
      const deleteSpy = jest.spyOn(sut['attachmentDao'], 'delete').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(deleteSpy).toHaveBeenCalledWith(id);
    });

    it('should throw AttachmentNotFoundError if attachmentDao.findById returns null', async() => {
      // Arrange
      jest.spyOn(sut['attachmentDao'], 'findById').mockResolvedValue(null);
      const deleteSpy = jest.spyOn(sut['attachmentDao'], 'delete');
      const id = 'non-existing-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(AttachmentNotFoundError);
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should return a success message on successful deletion', async() => {
      // Arrange
      const attachment = createMock<AttachmentDto>();
      jest.spyOn(sut['attachmentDao'], 'findById').mockResolvedValue(attachment);
      jest.spyOn(sut['attachmentDao'], 'delete').mockResolvedValue();

      // Act
      const result = await sut.execute(attachment.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Anexo deletado com sucesso!' });
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-attachment-delete-test',
          active: true,
        },
      });
    });

    it('should throw AttachmentNotFoundError if the attachment does not exist', async() => {
      // Act & Assert
      await expect(sut.execute('non-existing-id')).rejects.toThrow(AttachmentNotFoundError);
    });

    it('should delete an attachment successfully', async() => {
      // Arrange
      const createData = {
        name: null,
        link: 'https://example.com/to-be-deleted.doc',
        ownerId: owner01.id,
      };
      const createdAttachment = await createAttachment.execute(createData);

      // Act
      const result = await sut.execute(createdAttachment.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Anexo deletado com sucesso!' });
      // Verify deletion by trying to find it again
      await expect(findAttachmentById.execute(createdAttachment.id)).rejects.toThrow(AttachmentNotFoundError);
    });
  });
});
