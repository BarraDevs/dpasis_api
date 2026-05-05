import { Test } from '@nestjs/testing';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { resetResaleIntegrationState } from 'src/test/fixtures/minimal-resale';
import { GetResaleSequence } from './get-resale-sequence.service';

describe('GetResaleSequence - Integration tests', () => {
  let sut: GetResaleSequence;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleModule],
    }).compile();

    sut = module.get(GetResaleSequence);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await resetResaleIntegrationState(prisma, 42);
  });

  afterAll(async() => {
    await resetResaleIntegrationState(prisma, 1);
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return current nextId from resale_sequences', async() => {
    const result = await sut.execute();

    expect(result).toEqual({ nextId: 42 });
  });

  it('should reflect updates to sequence row', async() => {
    await prisma.resaleSequence.update({
      where: { id: 1 },
      data: { nextId: 900 },
    });

    const result = await sut.execute();

    expect(result.nextId).toBe(900);
  });
});
