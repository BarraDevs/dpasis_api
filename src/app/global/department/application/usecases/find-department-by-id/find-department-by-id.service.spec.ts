import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DepartmentModule } from '../../../department.module';
import { DepartmentNotFoundError } from '../../../domain/errors/department-not-found.error';
import { DepartmentDto } from '../../dtos/department.dto';
import { FindDepartmentById } from './find-department-by-id.service';

describe('FindDepartmentById - Integration tests', () => {
  let sut: FindDepartmentById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DepartmentModule],
    }).compile();

    sut = module.get(FindDepartmentById);
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
    await expect(sut.execute(0)).rejects.toThrow('Departamento não encontrado na base de dados.');
  });

  it('should throw DepartmentNotFoundError when department is inactive and onlyActive is true', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Department Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(departmentRow.id, { onlyActive: true })).rejects.toThrow(DepartmentNotFoundError);
    await expect(sut.execute(departmentRow.id, { onlyActive: true })).rejects.toThrow('Departamento não encontrado na base de dados.');
  });

  it('should return department by id', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Department Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(departmentRow.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(departmentRow.id);
    expect(result.name).toBe(departmentRow.name);
    expect(result.active).toBe(departmentRow.active);
  });

  it('should return all department fields correctly', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Department VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(departmentRow.id);

    expect(result).toEqual<DepartmentDto>({
      id: departmentRow.id,
      name: departmentRow.name,
      active: departmentRow.active,
      createdAt: departmentRow.createdAt,
      updatedAt: departmentRow.updatedAt,
    });
  });
});
