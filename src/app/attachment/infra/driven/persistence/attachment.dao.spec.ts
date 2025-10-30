import { Test } from '@nestjs/testing';
import { AttachmentPersistenceModule } from 'src/app/attachment/application/persistence/attachment-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AttachmentDaoAdapterPrisma } from './attachment.dao';

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

    await prisma.attachment.deleteMany();
  });

  afterAll(async() => {
    await prisma.attachment.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
