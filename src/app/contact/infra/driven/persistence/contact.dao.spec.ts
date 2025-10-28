import { Test } from '@nestjs/testing';
import { ContactPersistenceModule } from 'src/app/contact/application/persistence/contact-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ContactDaoAdapterPrisma } from './contact.dao';

describe('ContactDaoAdapterPrisma', () => {
  let sut: ContactDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ContactPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ContactDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ContactDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.contact.deleteMany();
  });

  afterAll(async() => {
    await prisma.contact.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
