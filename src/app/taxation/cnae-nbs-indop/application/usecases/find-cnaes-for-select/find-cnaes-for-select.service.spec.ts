import { Test } from '@nestjs/testing';
import { CnaeNbsIndopModule } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindCnaesForSelect } from './find-cnaes-for-select.service';

describe('FindCnaesForSelect - Integration tests', () => {
  let sut: FindCnaesForSelect;
  let prisma: PrismaService;
  let cnaeId: number;
  let nbsId: number;
  let indopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeNbsIndopModule],
    }).compile();

    sut = module.get(FindCnaesForSelect);
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

  it('should return empty array when no active combinations exist', async() => {
    const result = await sut.execute();

    expect(result).toEqual([]);
  });

  it('should return CNAEs that have active CnaeNbsIndop combinations', async() => {
    const [cnae2, indop2] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE2${Date.now()}`, description: 'CNAE 2', active: true } }),
      prisma.indop.create({ data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true } }),
    ]);
    await prisma.cnaeNbsIndop.createMany({
      data: [
        { cnaeId, nbsId, indopId },
        { cnaeId: cnae2.id, nbsId, indopId: indop2.id },
      ],
    });

    const result = await sut.execute();

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id).sort((a, b) => a - b)).toEqual([cnaeId, cnae2.id].sort((a, b) => a - b));
    expect(result[0]).toHaveProperty('code');
    expect(result[0]).toHaveProperty('description');
    expect(result[0]).toHaveProperty('active');
  });

  it('should exclude inactive CNAE and inactive CnaeNbsIndop', async() => {
    await prisma.cnaeNbsIndop.create({
      data: { cnaeId, nbsId, indopId, active: false },
    });

    const result = await sut.execute();

    expect(result).toEqual([]);
  });

  it('should return CNAEs ordered by code', async() => {
    const [cnaeZ, cnaeA] = await Promise.all([
      prisma.cnae.create({ data: { code: 'Z999', description: 'CNAE Z', active: true } }),
      prisma.cnae.create({ data: { code: 'A001', description: 'CNAE A', active: true } }),
    ]);
    const [indop2, indop3] = await Promise.all([
      prisma.indop.create({ data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true } }),
      prisma.indop.create({ data: { code: `IND3${Date.now()}`, description: 'INDOP 3', active: true } }),
    ]);
    await prisma.cnaeNbsIndop.createMany({
      data: [
        { cnaeId: cnaeZ.id, nbsId, indopId },
        { cnaeId: cnaeA.id, nbsId, indopId: indop2.id },
      ],
    });

    const result = await sut.execute();

    expect(result).toHaveLength(2);
    expect(result[0].code).toBe('A001');
    expect(result[1].code).toBe('Z999');
  });
});
