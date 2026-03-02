import { Test } from '@nestjs/testing';
import { ClientDepartmentDto } from 'src/app/client/client-department/application/dtos/client-department.dto';
import { CreateClientDepartmentInputDto } from 'src/app/client/client-department/application/usecases/create-client-department/dtos/create-client-department.dto';
import { EditClientDepartmentInputDto } from 'src/app/client/client-department/application/usecases/edit-client-department/dtos/edit-client-department.dto';
import { FindAllClientDepartmentQueryDto } from 'src/app/client/client-department/application/usecases/find-all-client-department/dtos/find-all-client-department.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDepartmentDaoAdapterPrisma } from './client-department-prisma.dao';

describe('ClientDepartmentDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientDepartmentDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientDepartmentDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientDepartmentDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no client departments exist', async() => {
      // Arrange
      const query: FindAllClientDepartmentQueryDto = {};

      // Act
      const [clientDepartments, total] = await sut.findAll(query);

      // Assert
      expect(clientDepartments).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client departments with default pagination', async() => {
      // Arrange
      await prisma.clientDepartment.createMany({
        data: [
          { name: 'Departamento 1', active: true },
          { name: 'Departamento 2', active: false },
        ],
      });
      const query: FindAllClientDepartmentQueryDto = {};

      // Act
      const [clientDepartments, total] = await sut.findAll(query);

      // Assert
      expect(clientDepartments).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.clientDepartment.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Departamento ${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [clientDepartments, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientDepartments2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(clientDepartments).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientDepartments2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in name field (case-insensitive)', async() => {
      // Arrange
      await prisma.clientDepartment.createMany({
        data: [
          { name: 'Departamento Premium', active: true },
          { name: 'Departamento Básico', active: true },
        ],
      });
      const query: FindAllClientDepartmentQueryDto = { search: 'premium' };

      // Act
      const [clientDepartments, total] = await sut.findAll(query);

      // Assert
      expect(clientDepartments).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientDepartments[0].name).toBe('Departamento Premium');
    });

    it('should return results ordered by name asc', async() => {
      // Arrange
      const cd1 = await prisma.clientDepartment.create({
        data: { name: 'A', active: true },
      });
      const cd2 = await prisma.clientDepartment.create({
        data: { name: 'B', active: true },
      });
      const query: FindAllClientDepartmentQueryDto = {};

      // Act
      const [clientDepartments] = await sut.findAll(query);

      // Assert
      expect(clientDepartments).toHaveLength(2);
      expect(clientDepartments[0].name).toBe(cd1.name);
      expect(clientDepartments[1].name).toBe(cd2.name);
    });

    it('should return all client department fields correctly', async() => {
      // Arrange
      const created = await prisma.clientDepartment.create({
        data: { name: 'Departamento Test', active: true },
      });
      const query: FindAllClientDepartmentQueryDto = {};

      // Act
      const [clientDepartments] = await sut.findAll(query);

      // Assert
      expect(clientDepartments).toHaveLength(1);
      expect(clientDepartments[0]).toEqual<ClientDepartmentDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client department does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return client department by id', async() => {
      // Arrange
      const created = await prisma.clientDepartment.create({
        data: { name: 'Departamento Test', active: true },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('Departamento Test');
      expect(result?.active).toBe(true);
    });

    it('should return all client department fields correctly', async() => {
      // Arrange
      const created = await prisma.clientDepartment.create({
        data: { name: 'Departamento Test', active: false },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<ClientDepartmentDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findByName', () => {
    it('should return null when client department does not exist', async() => {
      // Arrange
      await prisma.clientDepartment.create({
        data: { name: 'Departamento Test', active: true },
      });

      // Act
      const result = await sut.findByName('Departamento Test 2');

      // Assert
      expect(result).toBeNull();
    });

    it('should return client department by name', async() => {
      // Arrange
      const created = await prisma.clientDepartment.create({
        data: { name: 'Departamento Test', active: true },
      });

      // Act
      const result = await sut.findByName(created.name);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should find client department by name (case-insensitive)', async() => {
      // Arrange
      const created = await prisma.clientDepartment.create({
        data: { name: 'Departamento Test', active: true },
      });

      // Act
      const result = await sut.findByName('departamento test');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should return null if name is contained in another client department name', async() => {
      // Arrange
      await prisma.clientDepartment.create({
        data: { name: 'Departamento Test 1', active: true },
      });
      await prisma.clientDepartment.create({
        data: { name: 'Departamento Test 2', active: true },
      });

      // Act
      const result = await sut.findByName('Departamento Test');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create client department and return id', async() => {
      // Arrange
      const data: CreateClientDepartmentInputDto = {
        name: 'Departamento Premium',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientDepartment.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client department name', async() => {
      // Arrange
      const clientDepartment = await prisma.clientDepartment.create({
        data: { name: 'Nome original', active: true },
      });
      const data: EditClientDepartmentInputDto = { name: 'Nome atualizado' };

      // Act
      await sut.edit(clientDepartment.id, data);

      // Assert
      const updated = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
      expect(updated?.name).toBe('Nome atualizado');
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client department from database', async() => {
      // Arrange
      const clientDepartment = await prisma.clientDepartment.create({
        data: { name: 'Departamento', active: true },
      });

      // Act
      await sut.delete(clientDepartment.id);

      // Assert
      const deleted = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client department status', async() => {
      // Arrange
      const clientDepartment = await prisma.clientDepartment.create({
        data: { name: 'Departamento', active: true },
      });

      // Act
      await sut.updateStatus(clientDepartment.id, false);

      // Assert
      const updated = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(clientDepartment.id, true);

      // Assert (again)
      const updated2 = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
