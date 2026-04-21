import { Test } from '@nestjs/testing';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleNotFoundError } from '../../../domain/errors/resale-not-found.error';
import { makeCreateResaleInput, resetResaleIntegrationState } from '../resale-integration-test.helper';
import { CreateResale } from '../create-resale/create-resale.service';
import { FindResaleById } from './find-resale-by-id.service';

describe('FindResaleById - Integration tests', () => {
  let sut: FindResaleById;
  let createResale: CreateResale;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleModule],
    }).compile();

    sut = module.get(FindResaleById);
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

  it('should return resale dto when id exists', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    const result = await sut.execute(id);

    expect(result.id).toBe(id);
    expect(result.name).toBe('Revenda Teste');
    expect(result.document).toBe('09748165000110');
    expect(result.active).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should throw ResaleNotFoundError when id does not exist', async() => {
    await expect(sut.execute(99_999)).rejects.toThrow(ResaleNotFoundError);
  });

  it('should return inactive resale when onlyActive is false', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());
    await prisma.resale.update({ where: { id }, data: { active: false } });

    const result = await sut.execute(id, { onlyActive: false });

    expect(result.active).toBe(false);
  });

  it('should throw ResaleNotFoundError when onlyActive is true and resale is inactive', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());
    await prisma.resale.update({ where: { id }, data: { active: false } });

    await expect(sut.execute(id, { onlyActive: true })).rejects.toThrow(ResaleNotFoundError);
  });

  it('should return resale when onlyActive is true and resale is active', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    const result = await sut.execute(id, { onlyActive: true });

    expect(result.active).toBe(true);
  });
});
