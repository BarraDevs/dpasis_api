import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleDepartmentModule } from '../../../resale-department.module';
import { ResaleDepartmentAlreadyExistsError } from '../../../domain/errors/resale-department-already-exists.error';
import { ResaleDepartmentNotFoundError } from '../../../domain/errors/resale-department-not-found.error';
import { EditResaleDepartmentInputDto } from './dtos/edit-resale-department.dto';
import { EditResaleDepartment } from './edit-resale-department.service';

describe('EditResaleDepartment - Integration tests', () => {
  let sut: EditResaleDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleDepartmentModule],
    }).compile();

    sut = module.get(EditResaleDepartment);
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
    const data: EditResaleDepartmentInputDto = { name: 'Novo nome' };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ResaleDepartmentNotFoundError);
  });

  it('should update client department name', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Nome original', active: true },
    });
    const data: EditResaleDepartmentInputDto = { name: 'Nome atualizado' };

    // Act
    await sut.execute(resaleDepartment.id, data);

    // Assert
    const updated = await prisma.resaleDepartment.findUnique({ where: { id: resaleDepartment.id } });
    expect(updated?.name).toBe('Nome atualizado');
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento', active: true },
    });
    const data: EditResaleDepartmentInputDto = { name: 'Novo nome' };

    // Act
    const result = await sut.execute(resaleDepartment.id, data);

    // Assert
    expect(result).toEqual({ message: 'Departamento de revenda atualizado com sucesso' });
  });

  it('should throw ResaleDepartmentAlreadyExistsError when editing to duplicate name', async() => {
    // Arrange
    await prisma.resaleDepartment.create({
      data: { name: 'Departamento A', active: true },
    });
    const resaleDepartmentB = await prisma.resaleDepartment.create({
      data: { name: 'Departamento B', active: true },
    });
    const data: EditResaleDepartmentInputDto = { name: 'Departamento A' };

    // Act & Assert
    await expect(sut.execute(resaleDepartmentB.id, data)).rejects.toThrow(ResaleDepartmentAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same department being edited', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento', active: true },
    });
    const data: EditResaleDepartmentInputDto = { name: 'Departamento' };

    // Act
    await sut.execute(resaleDepartment.id, data);

    // Assert
    const updated = await prisma.resaleDepartment.findUnique({ where: { id: resaleDepartment.id } });
    expect(updated?.name).toBe('Departamento');
    expect(updated?.active).toBe(true);
  });
});
