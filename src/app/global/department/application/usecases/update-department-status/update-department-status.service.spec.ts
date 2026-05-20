import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DepartmentModule } from '../../../department.module';
import { DepartmentNotFoundError } from '../../../domain/errors/department-not-found.error';
import { UpdateDepartmentStatus } from './update-department-status.service';

describe('UpdateDepartmentStatus - Integration tests', () => {
  let sut: UpdateDepartmentStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DepartmentModule],
    }).compile();

    sut = module.get(UpdateDepartmentStatus);
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

  it('should throw DepartmentNotFoundError when department does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(DepartmentNotFoundError);
  });

  it('should invert active from true to false', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Department ${Date.now()}`, active: true },
    });

    await sut.execute(departmentRow.id);

    const updated = await prisma.department.findUnique({ where: { id: departmentRow.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Department ${Date.now()}`, active: false },
    });

    await sut.execute(departmentRow.id);

    const updated = await prisma.department.findUnique({ where: { id: departmentRow.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Department ${Date.now()}`, active: true },
    });

    const result = await sut.execute(departmentRow.id);

    expect(result).toEqual({ message: 'Status do departamento atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Manutenção ${Date.now()}`, active: true },
    });

    await sut.execute(departmentRow.id);

    const updated = await prisma.department.findUnique({ where: { id: departmentRow.id } });
    expect(updated?.name).toBe(departmentRow.name);
    expect(updated?.active).toBe(false);
  });
});
