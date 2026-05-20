import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DepartmentModule } from '../../../department.module';
import { DepartmentAlreadyExistsError } from '../../../domain/errors/department-already-exists.error';
import { DepartmentNotFoundError } from '../../../domain/errors/department-not-found.error';
import { EditDepartmentInputDto } from './dtos/edit-department.dto';
import { EditDepartment } from './edit-department.service';

describe('EditDepartment - Integration tests', () => {
  let sut: EditDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DepartmentModule],
    }).compile();

    sut = module.get(EditDepartment);
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
    const data: EditDepartmentInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(DepartmentNotFoundError);
  });

  it('should update department name', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditDepartmentInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(departmentRow.id, data);

    const updated = await prisma.department.findUnique({ where: { id: departmentRow.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Department ${Date.now()}`, active: true },
    });

    const data: EditDepartmentInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(departmentRow.id, data);

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });

  it('should throw DepartmentAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Department A ${Date.now()}`;
    await prisma.department.create({ data: { name: nameA, active: true } });
    const departmentB = await prisma.department.create({
      data: { name: `Department B ${Date.now()}`, active: true },
    });

    const data: EditDepartmentInputDto = { name: nameA };
    await expect(sut.execute(departmentB.id, data)).rejects.toThrow(DepartmentAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same department being edited', async() => {
    const name = `Department ${Date.now()}`;
    const departmentRow = await prisma.department.create({ data: { name, active: true } });

    const data: EditDepartmentInputDto = { name };
    await sut.execute(departmentRow.id, data);

    const updated = await prisma.department.findUnique({ where: { id: departmentRow.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
