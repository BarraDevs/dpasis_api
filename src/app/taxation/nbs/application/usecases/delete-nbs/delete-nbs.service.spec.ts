import { Test } from '@nestjs/testing';
import { NbsInUseError } from 'src/app/taxation/nbs/domain/errors/nbs-in-use.error';
import { NbsNotFoundError } from 'src/app/taxation/nbs/domain/errors/nbs-not-found.error';
import { NbsModule } from 'src/app/taxation/nbs/nbs.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteNbs } from './delete-nbs.service';

describe('DeleteNbs - Integration tests', () => {
  let sut: DeleteNbs;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NbsModule],
    }).compile();

    sut = module.get(DeleteNbs);
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

  it('should throw NbsNotFoundError when NBS does not exist', async() => {
    const id = 99999;

    await expect(sut.execute(id)).rejects.toThrow(NbsNotFoundError);
  });

  it('should throw NbsInUseError when there is a CNAE/NBS/INDOP combination using this NBS', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    await expect(sut.execute(nbs.id)).rejects.toThrow(NbsInUseError);
    await expect(sut.execute(nbs.id)).rejects.toThrow(
      'Não é possível excluir o NBS pois existem combinações CNAE/NBS/INDOP vinculadas.',
    );

    const stillExists = await prisma.nbs.findUnique({ where: { id: nbs.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete record and return success message when NBS exists and has no combinations', async() => {
    const created = await prisma.nbs.create({
      data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'NBS excluído com sucesso.' });

    const found = await prisma.nbs.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });
});
