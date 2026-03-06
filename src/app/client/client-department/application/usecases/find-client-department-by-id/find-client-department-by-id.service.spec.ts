import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDepartmentModule } from '../../../client-department.module';
import { ClientDepartmentNotFoundError } from '../../../domain/errors/client-department-not-found.error';
import { ClientDepartmentDto } from '../../dtos/client-department.dto';
import { FindClientDepartmentById } from './find-client-department-by-id.service';

describe('FindClientDepartmentById - Integration tests', () => {
  let sut: FindClientDepartmentById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDepartmentModule],
    }).compile();

    sut = module.get(FindClientDepartmentById);
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
    await expect(sut.execute(id)).rejects.toThrow('Departamento de clientes não encontrado na base de dados.');
  });

  it('should throw ClientDepartmentNotFoundError when client department is inactive and onlyActive is true', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento Premium', active: false },
    });

    // Act & Assert
    await expect(sut.execute(clientDepartment.id, { onlyActive: true })).rejects.toThrow(ClientDepartmentNotFoundError);
    await expect(sut.execute(clientDepartment.id, { onlyActive: true })).rejects.toThrow('Departamento de clientes não encontrado na base de dados.');
  });

  it('should return client department by id', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento Premium', active: true },
    });

    // Act
    const result = await sut.execute(clientDepartment.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(clientDepartment.id);
    expect(result.name).toBe(clientDepartment.name);
    expect(result.active).toBe(clientDepartment.active);
  });

  it('should return all client department fields correctly', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento VIP', active: false },
    });

    // Act
    const result = await sut.execute(clientDepartment.id);

    // Assert
    expect(result).toEqual<ClientDepartmentDto>({
      id: clientDepartment.id,
      name: clientDepartment.name,
      active: clientDepartment.active,
      createdAt: clientDepartment.createdAt,
      updatedAt: clientDepartment.updatedAt,
    });
  });
});
