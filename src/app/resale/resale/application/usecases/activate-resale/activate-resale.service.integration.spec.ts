import { Test } from '@nestjs/testing';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleNotFoundError } from '../../../domain/errors/resale-not-found.error';
import { makeCreateResaleInput, resetResaleIntegrationState } from 'src/test/fixtures/minimal-resale';
import { CreateResale } from '../create-resale/create-resale.service';
import { ActivateResale } from './activate-resale.service';

describe('ActivateResale - Integration tests', () => {
  let sut: ActivateResale;
  let createResale: CreateResale;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleModule],
    }).compile();

    sut = module.get(ActivateResale);
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

  it('should set active to true and return message', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());
    await prisma.resale.update({ where: { id }, data: { active: false } });

    const result = await sut.execute(id);

    expect(result.message).toBe('Revenda ativada com sucesso');
    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });
    expect(row.active).toBe(true);
  });

  it('should remain active when resale is already active', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    const result = await sut.execute(id);

    expect(result.message).toBe('Revenda ativada com sucesso');
    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });
    expect(row.active).toBe(true);
  });

  it('should throw ResaleNotFoundError when id does not exist', async() => {
    await expect(sut.execute(99_999)).rejects.toThrow(ResaleNotFoundError);
  });
});
