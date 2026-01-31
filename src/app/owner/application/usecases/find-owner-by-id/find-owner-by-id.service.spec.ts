import { Test, TestingModule } from '@nestjs/testing';
import { OwnerNotFoundError } from 'src/app/owner/domain/errors/owner-not-found.error';
import { OwnerModule } from 'src/app/owner/owner.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindOwnerById } from './find-owner-by-id.service';

describe('FindOwnerById', () => {
  let sut: FindOwnerById;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        OwnerModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindOwnerById);
    prisma = module.get(PrismaService);

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw an error if owner not found', async() => {
    // Act & Assert
    await expect(sut.execute('non-existing-id')).rejects.toThrow(OwnerNotFoundError);
  });

  it('should return owner if found', async() => {
    // Arrange
    const ownerId = 'owner-find-by-id-test-01';

    const createdOwner = await prisma.owner.create({
      data: {
        id: ownerId,
        active: true,
      },
    });

    // Act
    const owner = await sut.execute(ownerId);

    // Assert
    expect(owner).toBeDefined();
    expect(owner.id).toBe(createdOwner.id);
  });
});
