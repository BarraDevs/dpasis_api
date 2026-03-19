import { Test } from '@nestjs/testing';
import { CnaeNbsIndopModule } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindAllCnaeNbsIndop } from './find-all-cnae-nbs-indop.service';
import { FindAllCnaeNbsIndopQueryDto } from './dtos/find-all-cnae-nbs-indop.dto';

describe('FindAllCnaeNbsIndop - Integration tests', () => {
  let sut: FindAllCnaeNbsIndop;
  let prisma: PrismaService;
  let cnaeId: number;
  let nbsId: number;
  let indopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeNbsIndopModule],
    }).compile();

    sut = module.get(FindAllCnaeNbsIndop);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    cnaeId = cnae.id;
    nbsId = nbs.id;
    indopId = indop.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty array when no records exist', async() => {
    const queries: FindAllCnaeNbsIndopQueryDto = { page: 1, size: 10 };

    const result = await sut.execute(queries);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return paginated result with records', async() => {
    const indop2 = await prisma.indop.create({
      data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true },
    });
    await prisma.cnaeNbsIndop.createMany({
      data: [
        { cnaeId, nbsId, indopId },
        { cnaeId, nbsId, indopId: indop2.id },
      ],
    });

    const queries: FindAllCnaeNbsIndopQueryDto = { page: 1, size: 10 };
    const result = await sut.execute(queries);

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data[0]).toHaveProperty('id');
    expect(result.data[0]).toHaveProperty('cnae');
    expect(result.data[0]).toHaveProperty('nbs');
    expect(result.data[0]).toHaveProperty('indop');
  });

  it('should respect pagination with page and size', async() => {
    const [indop2, indop3] = await Promise.all([
      prisma.indop.create({ data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true } }),
      prisma.indop.create({ data: { code: `IND3${Date.now()}`, description: 'INDOP 3', active: true } }),
    ]);
    await prisma.cnaeNbsIndop.createMany({
      data: [
        { cnaeId, nbsId, indopId },
        { cnaeId, nbsId, indopId: indop2.id },
        { cnaeId, nbsId, indopId: indop3.id },
      ],
    });

    const result = await sut.execute({ page: 1, size: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(3);
  });

  it('should filter by cnaeId when provided', async() => {
    const otherCnae = await prisma.cnae.create({
      data: { code: `CNAE2${Date.now()}`, description: 'CNAE 2', active: true },
    });
    await prisma.cnaeNbsIndop.create({ data: { cnaeId, nbsId, indopId } });
    await prisma.cnaeNbsIndop.create({ data: { cnaeId: otherCnae.id, nbsId, indopId } });

    const result = await sut.execute({ page: 1, size: 10, cnaeId });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].cnae.id).toBe(cnaeId);
  });

  it('should filter by nbsId when provided', async() => {
    const otherNbs = await prisma.nbs.create({
      data: { code: `NBS2${Date.now()}`, description: 'NBS 2', active: true },
    });
    await prisma.cnaeNbsIndop.create({ data: { cnaeId, nbsId, indopId } });
    await prisma.cnaeNbsIndop.create({ data: { cnaeId, nbsId: otherNbs.id, indopId } });

    const result = await sut.execute({ page: 1, size: 10, nbsId });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].nbs.id).toBe(nbsId);
  });
});
