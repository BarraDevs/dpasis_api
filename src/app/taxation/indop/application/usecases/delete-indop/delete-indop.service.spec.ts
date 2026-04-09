import { Test } from '@nestjs/testing';
import { IndopInUseError } from 'src/app/taxation/indop/domain/errors/indop-in-use.error';
import { IndopNotFoundError } from 'src/app/taxation/indop/domain/errors/indop-not-found.error';
import { IndopModule } from 'src/app/taxation/indop/indop.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteIndop } from './delete-indop.service';

describe('DeleteIndop - Integration tests', () => {
  let sut: DeleteIndop;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [IndopModule],
    }).compile();

    sut = module.get(DeleteIndop);
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

  it('should throw IndopNotFoundError when INDOP does not exist', async() => {
    const id = 99999;

    await expect(sut.execute(id)).rejects.toThrow(IndopNotFoundError);
  });

  it('should throw IndopInUseError when there is a CNAE/NBS/INDOP combination using this INDOP', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    await expect(sut.execute(indop.id)).rejects.toThrow(IndopInUseError);
    await expect(sut.execute(indop.id)).rejects.toThrow(
      'Não é possível excluir o INDOP pois existem combinações CNAE/NBS/INDOP vinculadas.',
    );

    const stillExists = await prisma.indop.findUnique({ where: { id: indop.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete record and return success message when INDOP exists and has no combinations', async() => {
    const created = await prisma.indop.create({
      data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'INDOP excluído com sucesso.' });

    const found = await prisma.indop.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });
});
