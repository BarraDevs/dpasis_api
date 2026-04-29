import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleDepartmentModule } from '../../../resale-department.module';
import { ResaleDepartmentInUseError } from '../../../domain/errors/resale-department-in-use.error';
import { ResaleDepartmentNotFoundError } from '../../../domain/errors/resale-department-not-found.error';
import { DeleteResaleDepartment } from './delete-resale-department.service';

describe('DeleteResaleDepartment - Integration tests', () => {
  let sut: DeleteResaleDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleDepartmentModule],
    }).compile();

    sut = module.get(DeleteResaleDepartment);
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

  it('should delete client department from database', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    await sut.execute(resaleDepartment.id);

    // Assert
    const deleted = await prisma.resaleDepartment.findUnique({ where: { id: resaleDepartment.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    const result = await sut.execute(resaleDepartment.id);

    // Assert
    expect(result).toEqual({ message: 'Departamento de revenda excluído com sucesso' });
  });

  it('should throw ResaleDepartmentInUseError when department has linked contacts', async() => {
    const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
    const department = await prisma.resaleDepartment.create({
      data: { name: `Dept ${Date.now()}`, active: true },
    });

    await prisma.resaleContact.create({
      data: {
        resaleId: resale.id,
        departmentId: department.id,
        name: 'Contato',
        email: 'contato@example.com',
        receiveNF: false,
        active: true,
      },
    });

    await expect(sut.execute(department.id)).rejects.toThrow(ResaleDepartmentInUseError);
  });
});
