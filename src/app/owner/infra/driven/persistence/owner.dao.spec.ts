import { Test } from '@nestjs/testing';
import { OwnerPersistenceModule } from 'src/app/owner/application/persistence/owner-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { OwnerDaoAdapterPrisma } from './owner.dao';

describe('OwnerDaoAdapterPrisma', () => {
  let sut: OwnerDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        OwnerPersistenceModule,
        ConfigModule,
      ],
      providers: [
        OwnerDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(OwnerDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return null if owner not found', async() => {
    // Act
    const owner = await sut.findById('non-existing-id');

    // Assert
    expect(owner).toBeNull();
  });

  it('should return owner if found', async() => {
    const ownerId = 'owner-dao-test-01';

    const createdOwner = await prisma.owner.create({
      data: {
        id: ownerId,
        active: true,
      },
    });

    // Act
    const owner = await sut.findById(ownerId);

    // Assert
    expect(owner).toBeDefined();
    expect(owner?.id).toBe(createdOwner.id);
  });
});
