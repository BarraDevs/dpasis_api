import { Test } from '@nestjs/testing';
import { CnaeNbsIndopModule } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { CnaeNbsIndopNotFoundError } from 'src/app/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindCnaeNbsIndopById } from './find-cnae-nbs-indop-by-id.service';

describe('FindCnaeNbsIndopById', () => {
  let sut: FindCnaeNbsIndopById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeNbsIndopModule],
    }).compile();

    sut = module.get(FindCnaeNbsIndopById);
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

  it('should throw CnaeNbsIndopNotFoundError when not found', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(CnaeNbsIndopNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow(
      'Combinação CNAE + NBS + INDOP não encontrada na base de dados.',
    );
  });

  it('should return CnaeNbsIndopDto when found', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);

    const created = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const result = await sut.execute(created.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(created.id);
    expect(result.cnae.id).toBe(cnae.id);
    expect(result.cnae.code).toBe('1234567');
    expect(result.nbs.id).toBe(nbs.id);
    expect(result.indop.id).toBe(indop.id);
  });
});
