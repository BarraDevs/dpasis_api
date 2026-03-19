import { Test } from '@nestjs/testing';
import { CnaeNbsIndopModule } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { CnaeNotFoundError } from 'src/app/taxation/cnae/domain/errors/cnae-not-found.error';
import { IndopNotFoundError } from 'src/app/taxation/indop/domain/errors/indop-not-found.error';
import { NbsNotFoundError } from 'src/app/taxation/nbs/domain/errors/nbs-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CnaeNbsIndopAlreadyExistsError } from '../../../domain/errors/cnae-nbs-indop-already-exists.error';
import { CreateCnaeNbsIndop } from './create-cnae-nbs-indop.service';
import { CreateCnaeNbsIndopInputDto } from './dtos/create-cnae-nbs-indop.dto';

describe('CreateCnaeNbsIndop - Integration tests', () => {
  let sut: CreateCnaeNbsIndop;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeNbsIndopModule],
    }).compile();

    sut = module.get(CreateCnaeNbsIndop);
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

  it('should throw CnaeNotFoundError when cnaeId does not exist', async() => {
    const [nbs, indop] = await Promise.all([
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: 99999, nbsId: nbs.id, indopId: indop.id };

    await expect(sut.execute(input)).rejects.toThrow(CnaeNotFoundError);
  });

  it('should throw CnaeNotFoundError when cnae is inactive', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Inativo', active: false } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id };

    await expect(sut.execute(input)).rejects.toThrow(CnaeNotFoundError);
  });

  it('should throw NbsNotFoundError when nbsId does not exist', async() => {
    const [cnae, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: cnae.id, nbsId: 99999, indopId: indop.id };

    await expect(sut.execute(input)).rejects.toThrow(NbsNotFoundError);
  });

  it('should throw NbsNotFoundError when nbs is inactive', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Inativo', active: false } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id };

    await expect(sut.execute(input)).rejects.toThrow(NbsNotFoundError);
  });

  it('should throw IndopNotFoundError when indopId does not exist', async() => {
    const [cnae, nbs] = await Promise.all([
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
    ]);
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: cnae.id, nbsId: nbs.id, indopId: 99999 };

    await expect(sut.execute(input)).rejects.toThrow(IndopNotFoundError);
  });

  it('should throw IndopNotFoundError when indop is inactive', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Inativo', active: false } }),
    ]);
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id };

    await expect(sut.execute(input)).rejects.toThrow(IndopNotFoundError);
  });

  it('should throw CnaeNbsIndopAlreadyExistsError when combination already exists', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);
    await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id };

    await expect(sut.execute(input)).rejects.toThrow(CnaeNbsIndopAlreadyExistsError);
  });

  it('should create and return id when CNAE, NBS and INDOP exist and are active', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);
    const input: CreateCnaeNbsIndopInputDto = { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id };

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.cnaeNbsIndop.findUnique({
      where: { id: result.id },
    });
    expect(saved).not.toBeNull();
    expect(saved?.cnaeId).toBe(cnae.id);
    expect(saved?.nbsId).toBe(nbs.id);
    expect(saved?.indopId).toBe(indop.id);
  });
});
