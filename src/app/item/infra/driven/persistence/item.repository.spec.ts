import { Test } from '@nestjs/testing';
import { ItemPersistenceModule } from 'src/app/item/application/persistence/item-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ItemRepositoryAdapterPrisma } from './item.repository';

describe('ItemRepositoryAdapterPrisma', () => {
  let sut: ItemRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ItemPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ItemRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ItemRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.item.deleteMany();
  });

  afterAll(async() => {
    await prisma.item.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
