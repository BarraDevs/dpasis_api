import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { AttachmentModule } from 'src/app/attachment/attachment.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AttachmentDto } from '../../dtos/attachment.dto';
import { CreateAttachment } from '../create-attachment/create-attachment.service';
import { FindAllAttachmentQueryDto } from './dtos/find-all-attachment.dto';
import { FindAllAttachment } from './find-all-attachment.service';

describe('FindAllAttachment', () => {
  let sut: FindAllAttachment;
  let prisma: PrismaService;
  let createAttachment: CreateAttachment;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AttachmentModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllAttachment);
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
    it('should call attachmentDao.findAll with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllAttachmentQueryDto>({ ownerId: 'ownerId', page: 2, size: 5, search: 'doc' });
      const findAllSpy = jest.spyOn(sut['attachmentDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;
    let owner02: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-find-all-01',
        },
      });

      owner02 = await prisma.owner.create({
        data: {
          id: 'owner-find-all-02',
        },
      });
    });

    it('should return an empty pagination object when no attachments exist for the owner', async() => {
      // Act
      const result = await sut.execute({ ownerId: 'ownerId' });

      // Assert
      expect(result).toEqual<IPagination<AttachmentDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should return only attachments for the specified ownerId', async() => {
      // Arrange
      const att1 = await createAttachment.execute({ link: 'link1.pdf', ownerId: owner01.id });
      await createAttachment.execute({ link: 'link2.jpg', ownerId: owner02.id });
      const att3 = await createAttachment.execute({ link: 'link3.txt', ownerId: owner01.id });

      // Act
      const result = await sut.execute({ ownerId: owner01.id });

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data.map(a => a.id)).toEqual(expect.arrayContaining([att1.id, att3.id]));
      expect(result.data.every(a => a.ownerId === owner01.id)).toBe(true);
    });

    it('should return paginated attachments for the owner', async() => {
      // Arrange
      for (let i = 1; i <= 7; i++) {
        await createAttachment.execute({ link: `link${i}.dat`, ownerId: owner01.id });
      }

      // Act
      const resultPage1 = await sut.execute({ ownerId: owner01.id, page: 1, size: 5 });
      const resultPage2 = await sut.execute({ ownerId: owner01.id, page: 2, size: 5 });

      // Assert
      expect(resultPage1.data).toHaveLength(5);
      expect(resultPage1.totalItems).toBe(7);
      expect(resultPage1.totalPages).toBe(2);
      expect(resultPage1.currentPage).toBe(1);

      expect(resultPage2.data).toHaveLength(2);
      expect(resultPage2.totalItems).toBe(7);
      expect(resultPage2.totalPages).toBe(2);
      expect(resultPage2.currentPage).toBe(2);
    });

    it('should return attachments filtered by search term in link (case-insensitive)', async() => {
      // Arrange
      const att1 = await createAttachment.execute({ link: 'https://server.com/files/report.pdf', ownerId: owner01.id });
      await createAttachment.execute({ link: 'https://server.com/images/photo.jpg', ownerId: owner02.id });
      const att3 = await createAttachment.execute({ link: 'https://server.com/docs/annual_REPORT.docx', ownerId: owner01.id });

      // Act
      const result = await sut.execute({ ownerId: owner01.id, search: 'report' });

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data.map(a => a.id)).toEqual(expect.arrayContaining([att1.id, att3.id]));
    });
  });
});
