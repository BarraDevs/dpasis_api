import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { AttachmentModule } from 'src/app/attachment/attachment.module';
import { AttachmentNotFoundError } from 'src/app/attachment/domain/errors/attachment-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AttachmentDto } from '../../dtos/attachment.dto';
import { CreateAttachment } from '../create-attachment/create-attachment.service';
import { FindAttachmentById } from './find-attachment-by-id.service';

describe('FindAttachmentById', () => {
  let sut: FindAttachmentById;
  let prisma: PrismaService;
  let createAttachment: CreateAttachment;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AttachmentModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAttachmentById);
    prisma = module.get(PrismaService);
    createAttachment = module.get(CreateAttachment);

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
    it('should call attachmentDao.findById with correct parameters', async() => {
      // Arrange
      const attachment = createMock<AttachmentDto>();
      const findByIdSpy = jest.spyOn(sut['attachmentDao'], 'findById').mockResolvedValue(attachment);
      const id = 'existing-attachment-id';

      // Act
      await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
    });

    it('should throw AttachmentNotFoundError if attachmentDao returns null', async() => {
      // Arrange
      jest.spyOn(sut['attachmentDao'], 'findById').mockResolvedValue(null);
      const id = 'non-existing-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(AttachmentNotFoundError);
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-find-attachment-by-id',
        },
      });
    });

    it('should throw AttachmentNotFoundError if attachment is not found', async() => {
      // Act & Assert
      await expect(sut.execute('non-existing-id')).rejects.toThrow(AttachmentNotFoundError);
    });

    it('should return an attachment if found', async() => {
      // Arrange
      const createData = {
        link: 'https://example.com/file-to-find.txt',
        ownerId: owner01.id,
      };
      const createdAttachment = await createAttachment.execute(createData);

      // Act
      const foundAttachment = await sut.execute(createdAttachment.id);

      // Assert
      expect(foundAttachment).toBeDefined();
      expect(foundAttachment).toEqual<AttachmentDto>({
        id: createdAttachment.id,
        link: createData.link,
        ownerId: createData.ownerId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
