import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleDepartmentModule } from '../../../resale-department.module';
import { ResaleDepartmentAlreadyExistsError } from '../../../domain/errors/resale-department-already-exists.error';
import { CreateResaleDepartment } from './create-resale-department.service';
import { CreateResaleDepartmentInputDto } from './dtos/create-resale-department.dto';

describe('CreateResaleDepartment - Integration tests', () => {
  let sut: CreateResaleDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleDepartmentModule],
    }).compile();

    sut = module.get(CreateResaleDepartment);
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

  it('should throw ResaleDepartmentAlreadyExistsError when creating with duplicate name', async() => {
    // Arrange
    const input: CreateResaleDepartmentInputDto = {
      name: 'Departamento Duplicado',
    };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ResaleDepartmentAlreadyExistsError);
  });

  it('should create client department and return id', async() => {
    // Arrange
    const input: CreateResaleDepartmentInputDto = {
      name: 'Departamento Premium',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.resaleDepartment.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client department in database', async() => {
    // Arrange
    const input: CreateResaleDepartmentInputDto = {
      name: 'Departamento VIP',
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const resaleDepartment = await prisma.resaleDepartment.findUnique({ where: { id } });
    expect(resaleDepartment).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(resaleDepartment?.createdAt).toBeInstanceOf(Date);
    expect(resaleDepartment?.updatedAt).toBeInstanceOf(Date);
  });
});
