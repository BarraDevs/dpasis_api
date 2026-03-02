import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDepartmentModule } from '../../../client-department.module';
import { ClientDepartmentNotFoundError } from '../../../domain/errors/client-department-not-found.error';
import { UpdateClientDepartmentStatus } from './update-client-department-status.service';

describe('UpdateClientDepartmentStatus - Integration tests', () => {
  let sut: UpdateClientDepartmentStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDepartmentModule],
    }).compile();

    sut = module.get(UpdateClientDepartmentStatus);
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

  it('should throw ClientDepartmentNotFoundError when client department does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientDepartmentNotFoundError);
  });

  it('should invert active from true to false', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    await sut.execute(clientDepartment.id);

    // Assert
    const updated = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento', active: false },
    });

    // Act
    await sut.execute(clientDepartment.id);

    // Assert
    const updated = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    const result = await sut.execute(clientDepartment.id);

    // Assert
    expect(result).toEqual({ message: 'Status do departamento de clientes atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento Premium', active: true },
    });

    // Act
    await sut.execute(clientDepartment.id);

    // Assert
    const updated = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
    expect(updated?.name).toBe('Departamento Premium');
    expect(updated?.active).toBe(false);
  });
});
