import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { WarrantyNotFoundError } from '../../../domain/errors/warranty-not-found.error';
import { WarrantyModule } from '../../../warranty.module';
import { UpdateWarrantyStatus } from './update-warranty-status.service';

describe('UpdateWarrantyStatus - Integration tests', () => {
  let sut: UpdateWarrantyStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [WarrantyModule],
    }).compile();

    sut = module.get(UpdateWarrantyStatus);
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

  it('should throw WarrantyNotFoundError when warranty does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(WarrantyNotFoundError);
  });

  it('should invert active from true to false', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    await sut.execute(warranty.id);

    const updated = await prisma.warranty.findUnique({ where: { id: warranty.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty ${Date.now()}`, active: false },
    });

    await sut.execute(warranty.id);

    const updated = await prisma.warranty.findUnique({ where: { id: warranty.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    const result = await sut.execute(warranty.id);

    expect(result).toEqual({ message: 'Status da garantia atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `90 dias ${Date.now()}`, active: true },
    });

    await sut.execute(warranty.id);

    const updated = await prisma.warranty.findUnique({ where: { id: warranty.id } });
    expect(updated?.name).toBe(warranty.name);
    expect(updated?.active).toBe(false);
  });
});
