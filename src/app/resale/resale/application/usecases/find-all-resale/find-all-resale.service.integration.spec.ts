import { Test } from '@nestjs/testing';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { makeCreateResaleInput, resetResaleIntegrationState } from '../resale-integration-test.helper';
import { CreateResale } from '../create-resale/create-resale.service';
import { FindAllResale } from './find-all-resale.service';

describe('FindAllResale - Integration tests', () => {
  let sut: FindAllResale;
  let createResale: CreateResale;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleModule],
    }).compile();

    sut = module.get(FindAllResale);
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

  it('should return empty pagination when there are no resales', async() => {
    const result = await sut.execute({});

    expect(result.totalItems).toBe(0);
    expect(result.data).toEqual([]);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should list resales with default pagination (all rows)', async() => {
    await createResale.execute(makeCreateResaleInput({ name: 'Alpha' }));
    await createResale.execute(
      makeCreateResaleInput({ name: 'Beta', document: '28.695.096/0001-79' }),
    );

    const result = await sut.execute({});

    expect(result.totalItems).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(2);
    expect(result.data.map((r) => r.name).sort()).toEqual(['Alpha', 'Beta']);
  });

  it('should filter by active', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput({ name: 'On' }));
    await createResale.execute(
      makeCreateResaleInput({ name: 'Off', document: '28.695.096/0001-79' }),
    );
    await prisma.resale.update({ where: { id }, data: { active: false } });

    const inactive = await sut.execute({ active: false });

    expect(inactive.totalItems).toBe(1);
    expect(inactive.data[0].name).toBe('On');
    expect(inactive.data[0].active).toBe(false);

    const activeOnly = await sut.execute({ active: true });

    expect(activeOnly.totalItems).toBe(1);
    expect(activeOnly.data[0].name).toBe('Off');
  });

  it('should search by name substring', async() => {
    await createResale.execute(makeCreateResaleInput({ name: 'Revenda Norte' }));
    await createResale.execute(
      makeCreateResaleInput({ name: 'Outra', document: '28.695.096/0001-79' }),
    );

    const result = await sut.execute({ search: 'Norte' });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].name).toBe('Revenda Norte');
  });

  it('should paginate with page and size', async() => {
    await createResale.execute(makeCreateResaleInput({ name: 'R1' }));
    await createResale.execute(
      makeCreateResaleInput({ name: 'R2', document: '28.695.096/0001-79' }),
    );
    await createResale.execute(
      makeCreateResaleInput({ name: 'R3', document: '974.563.215-58' }),
    );

    const page1 = await sut.execute({ page: 1, size: 2 });
    const page2 = await sut.execute({ page: 2, size: 2 });

    expect(page1.totalItems).toBe(3);
    expect(page1.data).toHaveLength(2);
    expect(page2.data).toHaveLength(1);
    expect(page1.currentPage).toBe(1);
    expect(page2.currentPage).toBe(2);
    expect(page1.itemsPerPage).toBe(2);
  });
});
