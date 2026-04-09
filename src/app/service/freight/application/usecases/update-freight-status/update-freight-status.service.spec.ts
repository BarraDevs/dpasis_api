import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FreightNotFoundError } from '../../../domain/errors/freight-not-found.error';
import { FreightModule } from '../../../freight.module';
import { UpdateFreightStatus } from './update-freight-status.service';

describe('UpdateFreightStatus - Integration tests', () => {
  let sut: UpdateFreightStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FreightModule],
    }).compile();

    sut = module.get(UpdateFreightStatus);
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

  it('should throw FreightNotFoundError when freight does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(FreightNotFoundError);
  });

  it('should invert active from true to false', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    await sut.execute(freightRow.id);

    const updated = await prisma.freight.findUnique({ where: { id: freightRow.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight ${Date.now()}`, active: false },
    });

    await sut.execute(freightRow.id);

    const updated = await prisma.freight.findUnique({ where: { id: freightRow.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    const result = await sut.execute(freightRow.id);

    expect(result).toEqual({ message: 'Status do frete atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `CIF ${Date.now()}`, active: true },
    });

    await sut.execute(freightRow.id);

    const updated = await prisma.freight.findUnique({ where: { id: freightRow.id } });
    expect(updated?.name).toBe(freightRow.name);
    expect(updated?.active).toBe(false);
  });
});
