import { Test } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client/client.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { GetClientSequence } from './get-client-sequence.service';

describe('GetClientSequence - Integration tests', () => {
  let sut: GetClientSequence;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(GetClientSequence);
    prisma = module.get(PrismaService);
  });

  async function upsertSequence(nextId: number) {
    await prisma.clientSequence.upsert({
      where: { id: 1 },
      create: { id: 1, nextId },
      update: { nextId },
    });
  }

  beforeEach(async() => {
    await prisma.truncate();
    await upsertSequence(1);
  });

  afterAll(async() => {
    await prisma.truncate();
    await upsertSequence(1);
    await prisma.$disconnect();
  });

  it('should return nextId matching the client_sequences row', async() => {
    await upsertSequence(42);

    const result = await sut.execute();

    expect(result).toEqual({ nextId: 42 });
  });

  it('should reflect nextId updated directly in the database', async() => {
    await upsertSequence(100);

    expect(await sut.execute()).toEqual({ nextId: 100 });

    await upsertSequence(250);

    expect(await sut.execute()).toEqual({ nextId: 250 });
  });
});
