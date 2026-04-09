import { Test } from '@nestjs/testing';
import { CnaeNbsIndopModule } from 'src/app/global/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { CnaeNbsIndopNotFoundError } from 'src/app/global/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { UpdateCnaeNbsIndopStatus } from './update-cnae-nbs-indop-status.service';

describe('UpdateCnaeNbsIndopStatus - Integration tests', () => {
  let sut: UpdateCnaeNbsIndopStatus;
  let prisma: PrismaService;

  const createCnaeNbsIndop = async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE-${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS-${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `INDOP-${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    return prisma.cnaeNbsIndop.create({
      data: {
        cnaeId: cnae.id,
        nbsId: nbs.id,
        indopId: indop.id,
        active: true,
      },
    });
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeNbsIndopModule],
    }).compile();

    sut = module.get(UpdateCnaeNbsIndopStatus);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CnaeNbsIndopNotFoundError when combination does not exist', async() => {
    const id = 0;

    await expect(sut.execute(id)).rejects.toThrow(CnaeNbsIndopNotFoundError);
  });

  it('should invert active from true to false', async() => {
    const cnaeNbsIndop = await createCnaeNbsIndop();

    await sut.execute(cnaeNbsIndop.id);

    const updated = await prisma.cnaeNbsIndop.findUnique({ where: { id: cnaeNbsIndop.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const cnaeNbsIndop = await createCnaeNbsIndop();
    await prisma.cnaeNbsIndop.update({ where: { id: cnaeNbsIndop.id }, data: { active: false } });

    await sut.execute(cnaeNbsIndop.id);

    const updated = await prisma.cnaeNbsIndop.findUnique({ where: { id: cnaeNbsIndop.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const cnaeNbsIndop = await createCnaeNbsIndop();

    const result = await sut.execute(cnaeNbsIndop.id);

    expect(result).toEqual({ message: 'Status da combinação CNAE/NBS/INDOP atualizado com sucesso' });
  });
});
