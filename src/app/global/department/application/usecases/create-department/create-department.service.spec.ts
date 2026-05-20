import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DepartmentModule } from '../../../department.module';
import { DepartmentAlreadyExistsError } from '../../../domain/errors/department-already-exists.error';
import { CreateDepartment } from './create-department.service';
import { CreateDepartmentInputDto } from './dtos/create-department.dto';

describe('CreateDepartment - Integration tests', () => {
  let sut: CreateDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DepartmentModule],
    }).compile();

    sut = module.get(CreateDepartment);
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

  it('should throw DepartmentAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Department ${Date.now()}-${Math.random()}`;

    const input: CreateDepartmentInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(DepartmentAlreadyExistsError);
  });

  it('should create department and return id', async() => {
    const input: CreateDepartmentInputDto = {
      name: `Manutenção ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.department.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist department in database', async() => {
    const input: CreateDepartmentInputDto = {
      name: `Instalação ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const departmentRow = await prisma.department.findUnique({ where: { id } });
    expect(departmentRow).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(departmentRow?.createdAt).toBeInstanceOf(Date);
    expect(departmentRow?.updatedAt).toBeInstanceOf(Date);
  });
});
