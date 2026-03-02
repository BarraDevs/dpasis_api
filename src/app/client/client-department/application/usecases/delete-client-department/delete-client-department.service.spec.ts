import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDepartmentModule } from '../../../client-department.module';
import { ClientDepartmentNotFoundError } from '../../../domain/errors/client-department-not-found.error';
import { DeleteClientDepartment } from './delete-client-department.service';

describe('DeleteClientDepartment - Integration tests', () => {
  let sut: DeleteClientDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDepartmentModule],
    }).compile();

    sut = module.get(DeleteClientDepartment);
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

  it('should delete client department from database', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    await sut.execute(clientDepartment.id);

    // Assert
    const deleted = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    const result = await sut.execute(clientDepartment.id);

    // Assert
    expect(result).toEqual({ message: 'Departamento de clientes excluído com sucesso' });
  });
});
