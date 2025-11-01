import { Test } from '@nestjs/testing';
import { ItemPersistenceModule } from 'src/app/item/application/persistence/item-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ItemDaoAdapterPrisma } from './item.dao';

describe('ItemDaoAdapterPrisma', () => {
  let sut: ItemDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ItemPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ItemDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ItemDaoAdapterPrisma);
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
