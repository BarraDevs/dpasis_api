import { Test } from '@nestjs/testing';
import { CnaeNbsIndopModule } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindNbsByCnaeForSelect } from './find-nbs-by-cnae-for-select.service';
import { FindNbsByCnaeForSelectQueryDto } from './dtos/find-nbs-by-cnae-for-select.dto';

describe('FindNbsByCnaeForSelect - Integration tests', () => {
  let sut: FindNbsByCnaeForSelect;
  let prisma: PrismaService;
  let cnaeId: number;
  let nbsId: number;
  let indopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeNbsIndopModule],
    }).compile();

    sut = module.get(FindNbsByCnaeForSelect);
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

  it('should return empty array when no NBS combinations exist for CNAE', async() => {
    const queries: FindNbsByCnaeForSelectQueryDto = { cnaeId };

    const result = await sut.execute(queries);

    expect(result).toEqual([]);
  });

  it('should return NBSs that have active combinations with the given CNAE', async() => {
    const [nbs2, indop2] = await Promise.all([
      prisma.nbs.create({ data: { code: `NBS2${Date.now()}`, description: 'NBS 2', active: true } }),
      prisma.indop.create({ data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true } }),
    ]);
    await prisma.cnaeNbsIndop.createMany({
      data: [
        { cnaeId, nbsId, indopId },
        { cnaeId, nbsId: nbs2.id, indopId: indop2.id },
      ],
    });

    const queries: FindNbsByCnaeForSelectQueryDto = { cnaeId };
    const result = await sut.execute(queries);

    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id).sort((a, b) => a - b)).toEqual([nbsId, nbs2.id].sort((a, b) => a - b));
    expect(result[0]).toHaveProperty('code');
    expect(result[0]).toHaveProperty('description');
  });

  it('should exclude inactive NBS', async() => {
    const inactiveNbs = await prisma.nbs.create({
      data: { code: `NBS0${Date.now() % 100000}`, description: 'Inactive', active: false },
    });
    await prisma.cnaeNbsIndop.create({
      data: { cnaeId, nbsId: inactiveNbs.id, indopId },
    });

    const queries: FindNbsByCnaeForSelectQueryDto = { cnaeId };
    const result = await sut.execute(queries);

    expect(result).toEqual([]);
  });

  it('should return only NBSs for the given CNAE', async() => {
    const otherCnae = await prisma.cnae.create({
      data: { code: `CNAE2${Date.now()}`, description: 'CNAE 2', active: true },
    });
    const nbs2 = await prisma.nbs.create({
      data: { code: `NBS2${Date.now()}`, description: 'NBS 2', active: true },
    });
    const indop2 = await prisma.indop.create({
      data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true },
    });
    await prisma.cnaeNbsIndop.create({ data: { cnaeId, nbsId, indopId } });
    await prisma.cnaeNbsIndop.create({ data: { cnaeId: otherCnae.id, nbsId: nbs2.id, indopId: indop2.id } });

    const queries: FindNbsByCnaeForSelectQueryDto = { cnaeId };
    const result = await sut.execute(queries);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(nbsId);
  });
});
