import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { AttachmentModule } from 'src/app/attachment/attachment.module'; // Adjust import path
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
    it('should call attachmentDao.save with correct values', async() => {
      // Arrange
      const id = 'attachment-id-123';
      const input = createMock<CreateAttachmentInputDto>();
      const attachmentDaoSpy = jest.spyOn(sut['attachmentDao'], 'save').mockResolvedValue(id);

      // Act
      await sut.execute(input);

      // Assert
      expect(attachmentDaoSpy).toHaveBeenCalledWith(input);
    });

    it('should return correct output dto', async() => {
      // Arrange
      const id = 'attachment-id-456';
      const input = createMock<CreateAttachmentInputDto>();
      jest.spyOn(sut['attachmentDao'], 'save').mockResolvedValue(id);

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
        data: { id: 'owner-integration-test' },
      });
    });

    it('should create an attachment with valid data', async() => {
      // Arrange
      const input: CreateAttachmentInputDto = {
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
        link: input.link,
        ownerId: input.ownerId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
