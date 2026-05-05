import { Test } from '@nestjs/testing';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleSequenceInvalidNextIdError } from '../../../domain/errors/resale-sequence-invalid-next-id.error';
import { makeCreateResaleInput, resetResaleIntegrationState } from 'src/test/fixtures/minimal-resale';
import { CreateResale } from '../create-resale/create-resale.service';
import { SetResaleNextId } from './set-resale-next-id.service';

describe('SetResaleNextId - Integration tests', () => {
  let sut: SetResaleNextId;
  let createResale: CreateResale;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleModule],
    }).compile();

    sut = module.get(SetResaleNextId);
    createResale = module.get(CreateResale);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await resetResaleIntegrationState(prisma, 1);
  });

  afterAll(async() => {
    await resetResaleIntegrationState(prisma, 1);
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should set nextId when greater than max resale id (empty table)', async() => {
    const result = await sut.execute({ nextId: 1 });

    expect(result.message).toBe('Próximo ID de revenda definido para 1.');
    const row = await prisma.resaleSequence.findUniqueOrThrow({ where: { id: 1 } });
    expect(row.nextId).toBe(1);
  });

  it('should persist large nextId when valid', async() => {
    await sut.execute({ nextId: 10_000 });

    const row = await prisma.resaleSequence.findUniqueOrThrow({ where: { id: 1 } });
    expect(row.nextId).toBe(10_000);
  });

  it('should throw when nextId equals max existing id', async() => {
    await createResale.execute(makeCreateResaleInput({ id: 50, document: '09.748.165/0001-10' }));

    await expect(sut.execute({ nextId: 50 })).rejects.toThrow(ResaleSequenceInvalidNextIdError);
    await expect(sut.execute({ nextId: 50 })).rejects.toThrow('O próximo ID 50 é inválido');
  });

  it('should throw when nextId is less than max existing id', async() => {
    await createResale.execute(makeCreateResaleInput({ id: 100, document: '09.748.165/0001-10' }));

    await expect(sut.execute({ nextId: 50 })).rejects.toThrow(ResaleSequenceInvalidNextIdError);
  });

  it('should allow nextId maxId + 1 after creating resale', async() => {
    await createResale.execute(makeCreateResaleInput({ id: 7, document: '09.748.165/0001-10' }));

    const result = await sut.execute({ nextId: 8 });

    expect(result.message).toContain('8');
    expect(
      (await prisma.resaleSequence.findUniqueOrThrow({ where: { id: 1 } })).nextId,
    ).toBe(8);
  });
});
