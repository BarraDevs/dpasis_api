import { Test } from '@nestjs/testing';
import { CnaeNbsIndopModule } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { CnaeNbsIndopNotFoundError } from 'src/app/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteCnaeNbsIndop } from './delete-cnae-nbs-indop.service';

describe('DeleteCnaeNbsIndop - Integration tests', () => {
  let sut: DeleteCnaeNbsIndop;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeNbsIndopModule],
    }).compile();

    sut = module.get(DeleteCnaeNbsIndop);
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
    const id = 99999;

    await expect(sut.execute(id)).rejects.toThrow(CnaeNbsIndopNotFoundError);
  });

  it('should delete record and return success message when combination exists', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const created = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Combinação excluída com sucesso.' });

    const found = await prisma.cnaeNbsIndop.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });
});
