import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { AttachmentModule } from 'src/app/attachment/attachment.module'; // Adjust import path
import { OwnerNotActiveError } from 'src/app/owner/domain/errors/owner-not-active.error';
import { OwnerNotFoundError } from 'src/app/owner/domain/errors/owner-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AttachmentDto } from '../../dtos/attachment.dto';
import { FindAttachmentById } from '../find-attachment-by-id/find-attachment-by-id.service'; // Adjust import path
import { CreateAttachment } from './create-attachment.service';
import { CreateAttachmentInputDto, CreateAttachmentOutputDto } from './dtos/create-attachment.dto';

describe('CreateAttachment', () => {
  let sut: CreateAttachment;
  let prisma: PrismaService;
  let findAttachmentById: FindAttachmentById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AttachmentModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateAttachment);
    prisma = module.get(PrismaService);
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
    it('should call attachmentDao.save with correct values', async() => {
      // Arrange
      const id = 'attachment-id-123';
      const input = createMock<CreateAttachmentInputDto>();
      const attachmentDaoSpy = jest.spyOn(sut['attachmentDao'], 'save').mockResolvedValue(id);

      const owner = createMock<Owner>();
      jest.spyOn(sut['findOwnerById'], 'execute').mockResolvedValue(owner);

      // Act
      await sut.execute(input);

      // Assert
      expect(attachmentDaoSpy).toHaveBeenCalledWith({ ...input, ownerId: owner.id });
    });

    it('should return correct output dto', async() => {
      // Arrange
      const id = 'attachment-id-456';
      const input = createMock<CreateAttachmentInputDto>();
      jest.spyOn(sut['attachmentDao'], 'save').mockResolvedValue(id);

      const owner = createMock<Owner>();
      jest.spyOn(sut['findOwnerById'], 'execute').mockResolvedValue(owner);

      // Act
      const result = await sut.execute(input);

      // Assert
      expect(result).toEqual<CreateAttachmentOutputDto>({ id });
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-integration-test',
          active: true,
        },
      });
    });

    it('should throw error when owner does not exist', async() => {
      // Arrange
      const input: CreateAttachmentInputDto = {
        name: 'my_document.pdf',
        link: 'https://example.com/path/to/my_document.pdf',
        ownerId: 'non-existent-owner-id',
      };

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow(OwnerNotFoundError);
    });

    it('should throw an error if owner is not active', async() => {
      // Arrange
      await prisma.owner.update({
        where: { id: owner01.id },
        data: { active: false },
      });

      const input: CreateAttachmentInputDto = {
        name: 'my_document.pdf',
        link: 'https://example.com/path/to/my_document.pdf',
        ownerId: owner01.id,
      };

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow(OwnerNotActiveError);
    });

    it('should create an attachment with valid data', async() => {
      // Arrange
      const input: CreateAttachmentInputDto = {
        name: 'my_document.pdf',
        link: 'https://example.com/path/to/my_document.pdf',
        ownerId: owner01.id,
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      const createdAttachment = await findAttachmentById.execute(output.id);
      expect(createdAttachment).toBeDefined();
      expect(createdAttachment).toEqual<AttachmentDto>({
        id: output.id,
        name: input.name,
        link: input.link,
        ownerId: input.ownerId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create an attachment without name (optional field)', async() => {
      // Arrange
      const input: CreateAttachmentInputDto = {
        name: null,
        link: 'https://example.com/path/to/unnamed_document.pdf',
        ownerId: owner01.id,
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      const createdAttachment = await findAttachmentById.execute(output.id);
      expect(createdAttachment).toBeDefined();
      expect(createdAttachment).toEqual<AttachmentDto>({
        id: output.id,
        name: null,
        link: input.link,
        ownerId: input.ownerId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
