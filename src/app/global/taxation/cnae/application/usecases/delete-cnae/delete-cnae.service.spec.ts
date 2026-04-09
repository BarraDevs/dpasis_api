import { Test } from '@nestjs/testing';
import { CnaeModule } from 'src/app/global/taxation/cnae/cnae.module';
import { CnaeInUseError } from 'src/app/global/taxation/cnae/domain/errors/cnae-in-use.error';
import { CnaeNotFoundError } from 'src/app/global/taxation/cnae/domain/errors/cnae-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteCnae } from './delete-cnae.service';

describe('DeleteCnae - Integration tests', () => {
  let sut: DeleteCnae;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeModule],
    }).compile();

    sut = module.get(DeleteCnae);
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

  it('should throw CnaeNotFoundError when CNAE does not exist', async() => {
    const id = 99999;

    await expect(sut.execute(id)).rejects.toThrow(CnaeNotFoundError);
  });

  it('should throw CnaeInUseError when there is a CNAE/NBS/INDOP combination using this CNAE', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    await expect(sut.execute(cnae.id)).rejects.toThrow(CnaeInUseError);
    await expect(sut.execute(cnae.id)).rejects.toThrow('Não é possível excluir o CNAE pois existem combinações CNAE/NBS/INDOP vinculadas.');

    const stillExists = await prisma.cnae.findUnique({ where: { id: cnae.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete record and return success message when CNAE exists and has no combinations', async() => {
    const created = await prisma.cnae.create({
      data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'CNAE excluído com sucesso.' });

    const found = await prisma.cnae.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });
});
