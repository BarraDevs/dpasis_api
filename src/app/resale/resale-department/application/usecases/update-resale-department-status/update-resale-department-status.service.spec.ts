import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleDepartmentModule } from '../../../resale-department.module';
import { ResaleDepartmentNotFoundError } from '../../../domain/errors/resale-department-not-found.error';
import { UpdateResaleDepartmentStatus } from './update-resale-department-status.service';

describe('UpdateResaleDepartmentStatus - Integration tests', () => {
  let sut: UpdateResaleDepartmentStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleDepartmentModule],
    }).compile();

    sut = module.get(UpdateResaleDepartmentStatus);
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
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    await sut.execute(resaleDepartment.id);

    // Assert
    const updated = await prisma.resaleDepartment.findUnique({ where: { id: resaleDepartment.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento', active: false },
    });

    // Act
    await sut.execute(resaleDepartment.id);

    // Assert
    const updated = await prisma.resaleDepartment.findUnique({ where: { id: resaleDepartment.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    const result = await sut.execute(resaleDepartment.id);

    // Assert
    expect(result).toEqual({ message: 'Status do departamento de revenda atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento Premium', active: true },
    });

    // Act
    await sut.execute(resaleDepartment.id);

    // Assert
    const updated = await prisma.resaleDepartment.findUnique({ where: { id: resaleDepartment.id } });
    expect(updated?.name).toBe('Departamento Premium');
    expect(updated?.active).toBe(false);
  });
});
