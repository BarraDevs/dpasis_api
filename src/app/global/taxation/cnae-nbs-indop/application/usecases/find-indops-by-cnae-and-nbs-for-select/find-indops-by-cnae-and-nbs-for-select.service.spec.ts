import { Test } from '@nestjs/testing';
import { CnaeNbsIndopModule } from 'src/app/global/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindIndopsByCnaeAndNbsForSelectQueryDto } from './dtos/find-indops-by-cnae-and-nbs-for-select.dto';
import { FindIndopsByCnaeAndNbsForSelect } from './find-indops-by-cnae-and-nbs-for-select.service';

describe('FindIndopsByCnaeAndNbsForSelect - Integration tests', () => {
  let sut: FindIndopsByCnaeAndNbsForSelect;
  let prisma: PrismaService;
  let cnaeId: number;
  let nbsId: number;
  let indopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeNbsIndopModule],
    }).compile();

    sut = module.get(FindIndopsByCnaeAndNbsForSelect);
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

  it('should return empty array when no INDOP combinations exist', async() => {
    const queries: FindIndopsByCnaeAndNbsForSelectQueryDto = { cnaeId, nbsId };

    const result = await sut.execute(queries);

    expect(result).toEqual([]);
  });

  it('should return INDOPs that have active combinations with the given CNAE and NBS', async() => {
    const indop2 = await prisma.indop.create({
      data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true },
    });
    await prisma.cnaeNbsIndop.createMany({
      data: [
        { cnaeId, nbsId, indopId },
        { cnaeId, nbsId, indopId: indop2.id },
      ],
    });

    const queries: FindIndopsByCnaeAndNbsForSelectQueryDto = { cnaeId, nbsId };
    const result = await sut.execute(queries);

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id).sort((a, b) => a - b)).toEqual([indopId, indop2.id].sort((a, b) => a - b));
    expect(result[0]).toHaveProperty('code');
    expect(result[0]).toHaveProperty('description');
  });

  it('should exclude inactive INDOP', async() => {
    const inactiveIndop = await prisma.indop.create({
      data: { code: `IND0${Date.now() % 100000}`, description: 'Inactive', active: false },
    });
    await prisma.cnaeNbsIndop.create({
      data: { cnaeId, nbsId, indopId: inactiveIndop.id },
    });

    const queries: FindIndopsByCnaeAndNbsForSelectQueryDto = { cnaeId, nbsId };
    const result = await sut.execute(queries);

    expect(result).toEqual([]);
  });

  it('should return only INDOPs for the given CNAE and NBS combination', async() => {
    const [otherCnae, otherNbs, indop2] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE2${Date.now()}`, description: 'CNAE 2', active: true } }),
      prisma.nbs.create({ data: { code: `NBS2${Date.now()}`, description: 'NBS 2', active: true } }),
      prisma.indop.create({ data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true } }),
    ]);
    await prisma.cnaeNbsIndop.create({ data: { cnaeId, nbsId, indopId } });
    await prisma.cnaeNbsIndop.create({
      data: { cnaeId: otherCnae.id, nbsId: otherNbs.id, indopId: indop2.id },
    });

    const queries: FindIndopsByCnaeAndNbsForSelectQueryDto = { cnaeId, nbsId };
    const result = await sut.execute(queries);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(indopId);
  });
});
