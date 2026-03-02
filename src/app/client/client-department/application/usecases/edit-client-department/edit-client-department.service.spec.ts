import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDepartmentModule } from '../../../client-department.module';
import { ClientDepartmentAlreadyExistsError } from '../../../domain/errors/client-department-already-exists.error';
import { ClientDepartmentNotFoundError } from '../../../domain/errors/client-department-not-found.error';
import { EditClientDepartmentInputDto } from './dtos/edit-client-department.dto';
import { EditClientDepartment } from './edit-client-department.service';

describe('EditClientDepartment - Integration tests', () => {
  let sut: EditClientDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDepartmentModule],
    }).compile();

    sut = module.get(EditClientDepartment);
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
    const data: EditClientDepartmentInputDto = { name: 'Novo nome' };

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientDepartmentNotFoundError);
  });

  it('should update client department name', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Nome original', active: true },
    });
    const data: EditClientDepartmentInputDto = { name: 'Nome atualizado' };

    // Act
    await sut.execute(clientDepartment.id, data);

    // Assert
    const updated = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
    expect(updated?.name).toBe('Nome atualizado');
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento', active: true },
    });
    const data: EditClientDepartmentInputDto = { name: 'Novo nome' };

    // Act
    const result = await sut.execute(clientDepartment.id, data);

    // Assert
    expect(result).toEqual({ message: 'Departamento de clientes atualizado com sucesso' });
  });

  it('should throw ClientDepartmentAlreadyExistsError when editing to duplicate name', async() => {
    // Arrange
    await prisma.clientDepartment.create({
      data: { name: 'Departamento A', active: true },
    });
    const clientDepartmentB = await prisma.clientDepartment.create({
      data: { name: 'Departamento B', active: true },
    });
    const data: EditClientDepartmentInputDto = { name: 'Departamento A' };

    // Act & Assert
    await expect(sut.execute(clientDepartmentB.id, data)).rejects.toThrow(ClientDepartmentAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same department being edited', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento', active: true },
    });
    const data: EditClientDepartmentInputDto = { name: 'Departamento' };

    // Act
    await sut.execute(clientDepartment.id, data);

    // Assert
    const updated = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
    expect(updated?.name).toBe('Departamento');
    expect(updated?.active).toBe(true);
  });
});
