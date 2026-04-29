import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleDepartmentModule } from '../../../resale-department.module';
import { ResaleDepartmentNotFoundError } from '../../../domain/errors/resale-department-not-found.error';
import { ResaleDepartmentDto } from '../../dtos/resale-department.dto';
import { FindResaleDepartmentById } from './find-resale-department-by-id.service';

describe('FindResaleDepartmentById - Integration tests', () => {
  let sut: FindResaleDepartmentById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleDepartmentModule],
    }).compile();

    sut = module.get(FindResaleDepartmentById);
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

  it('should throw ResaleDepartmentNotFoundError when client department does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ResaleDepartmentNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Departamento de revenda não encontrado na base de dados.');
  });

  it('should throw ResaleDepartmentNotFoundError when client department is inactive and onlyActive is true', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento Premium', active: false },
    });

    // Act & Assert
    await expect(sut.execute(resaleDepartment.id, { onlyActive: true })).rejects.toThrow(ResaleDepartmentNotFoundError);
    await expect(sut.execute(resaleDepartment.id, { onlyActive: true })).rejects.toThrow('Departamento de revenda não encontrado na base de dados.');
  });

  it('should return client department by id', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento Premium', active: true },
    });

    // Act
    const result = await sut.execute(resaleDepartment.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(resaleDepartment.id);
    expect(result.name).toBe(resaleDepartment.name);
    expect(result.active).toBe(resaleDepartment.active);
  });

  it('should return all client department fields correctly', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento VIP', active: false },
    });

    // Act
    const result = await sut.execute(resaleDepartment.id);

    // Assert
    expect(result).toEqual<ResaleDepartmentDto>({
      id: resaleDepartment.id,
      name: resaleDepartment.name,
      active: resaleDepartment.active,
      createdAt: resaleDepartment.createdAt,
      updatedAt: resaleDepartment.updatedAt,
    });
  });
});
