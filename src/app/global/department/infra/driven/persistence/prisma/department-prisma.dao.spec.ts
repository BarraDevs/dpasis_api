import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { DepartmentDto } from 'src/app/global/department/application/dtos/department.dto';
import { CreateDepartmentInputDto } from 'src/app/global/department/application/usecases/create-department/dtos/create-department.dto';
import { EditDepartmentInputDto } from 'src/app/global/department/application/usecases/edit-department/dtos/edit-department.dto';
import { FindAllDepartmentQueryDto } from 'src/app/global/department/application/usecases/find-all-department/dtos/find-all-department.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DepartmentDaoAdapterPrisma } from './department-prisma.dao';

describe('DepartmentDaoAdapterPrisma - Integration tests', () => {
  let sut: DepartmentDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [DepartmentDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(DepartmentDaoAdapterPrisma);
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
      const query: FindAllDepartmentQueryDto = {};

      // Act
      const [departments, total] = await sut.findAll(query);

      // Assert
      expect(departments).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client departments with default pagination', async() => {
      // Arrange
      await prisma.department.createMany({
        data: [
          { name: 'Departamento 1', active: true },
          { name: 'Departamento 2', active: false },
        ],
      });
      const query: FindAllDepartmentQueryDto = {};

      // Act
      const [departments, total] = await sut.findAll(query);

      // Assert
      expect(departments).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should filter by active when provided', async() => {
      await prisma.department.createMany({
        data: [
          { name: 'Dept Ativo', active: true },
          { name: 'Dept Inativo', active: false },
        ],
      });

      const [activeDepts, activeTotal] = await sut.findAll({ active: true });
      const [inactiveDepts, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeDepts).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeDepts[0].active).toBe(true);
      expect(inactiveDepts).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveDepts[0].active).toBe(false);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.department.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Departamento ${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [departments, total] = await sut.findAll({ page: 1, size: 10 });
      const [departments2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(departments).toHaveLength(10);
      expect(total).toBe(25);
      expect(departments2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in name field (case-insensitive)', async() => {
      // Arrange
      await prisma.department.createMany({
        data: [
          { name: 'Departamento Premium', active: true },
          { name: 'Departamento Básico', active: true },
        ],
      });
      const query: FindAllDepartmentQueryDto = { search: 'premium' };

      // Act
      const [departments, total] = await sut.findAll(query);

      // Assert
      expect(departments).toHaveLength(1);
      expect(total).toBe(1);
      expect(departments[0].name).toBe('Departamento Premium');
    });

    it('should return results ordered by name asc', async() => {
      // Arrange
      const cd1 = await prisma.department.create({
        data: { name: 'A', active: true },
      });
      const cd2 = await prisma.department.create({
        data: { name: 'B', active: true },
      });
      const query: FindAllDepartmentQueryDto = {};

      // Act
      const [departments] = await sut.findAll(query);

      // Assert
      expect(departments).toHaveLength(2);
      expect(departments[0].name).toBe(cd1.name);
      expect(departments[1].name).toBe(cd2.name);
    });

    it('should return all client department fields correctly', async() => {
      // Arrange
      const created = await prisma.department.create({
        data: { name: 'Departamento Test', active: true },
      });
      const query: FindAllDepartmentQueryDto = {};

      // Act
      const [departments] = await sut.findAll(query);

      // Assert
      expect(departments).toHaveLength(1);
      expect(departments[0]).toEqual<DepartmentDto>({
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
      const created = await prisma.department.create({
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
      const created = await prisma.department.create({
        data: { name: 'Departamento Test', active: false },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<DepartmentDto>({
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
      await prisma.department.create({
        data: { name: 'Departamento Test', active: true },
      });

      // Act
      const result = await sut.findByName('Departamento Test 2');

      // Assert
      expect(result).toBeNull();
    });

    it('should return client department by name', async() => {
      // Arrange
      const created = await prisma.department.create({
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
      const created = await prisma.department.create({
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
      await prisma.department.create({
        data: { name: 'Departamento Test 1', active: true },
      });
      await prisma.department.create({
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
      const data: CreateDepartmentInputDto = {
        name: 'Departamento Premium',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.department.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client department name', async() => {
      // Arrange
      const department = await prisma.department.create({
        data: { name: 'Nome original', active: true },
      });
      const data: EditDepartmentInputDto = { name: 'Nome atualizado' };

      // Act
      await sut.edit(department.id, data);

      // Assert
      const updated = await prisma.department.findUnique({ where: { id: department.id } });
      expect(updated?.name).toBe('Nome atualizado');
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client department from database', async() => {
      // Arrange
      const department = await prisma.department.create({
        data: { name: 'Departamento', active: true },
      });

      // Act
      await sut.delete(department.id);

      // Assert
      const deleted = await prisma.department.findUnique({ where: { id: department.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client department status', async() => {
      // Arrange
      const department = await prisma.department.create({
        data: { name: 'Departamento', active: true },
      });

      // Act
      await sut.updateStatus(department.id, false);

      // Assert
      const updated = await prisma.department.findUnique({ where: { id: department.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(department.id, true);

      // Assert (again)
      const updated2 = await prisma.department.findUnique({ where: { id: department.id } });
      expect(updated2?.active).toBe(true);
    });
  });

  describe('countClientContactsByDepartmentId', () => {
    it('should return 0 when no contacts exist for the department', async() => {
      // Arrange
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: 'Grupo', active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        prisma.company.create({ data: buildMinimalCompanyData() }),
      ]);
      const client = await prisma.client.create({
        data: {
          id: 1,
          type: 'PJ',
          document: '09748165000110',
          ie: null,
          groupId: group.id,
          resaleId: resale.id,
          companyId: company.id,
          companyName: 'Empresa',
          fantasyName: null,
          headquarters: 'SP',
          invoiceType: 'CONTRACT',
          generateInvoice: true,
          active: true,
        },
      });
      const departmentWithContacts = await prisma.department.create({
        data: { name: 'Departamento Com Contatos', active: true },
      });
      const departmentWithoutContacts = await prisma.department.create({
        data: { name: 'Departamento Sem Contatos', active: true },
      });
      await prisma.clientContact.create({
        data: {
          clientId: client.id,
          departmentId: departmentWithContacts.id,
          name: 'Contato',
          email: 'contato@test.com',
          receiveNF: true,
          active: true,
        },
      });

      // Act
      const count = await sut.countClientContactsByDepartmentId(departmentWithoutContacts.id);

      // Assert
      expect(count).toBe(0);
    });

    it('should return correct count of contacts for the department', async() => {
      // Arrange
      const [group, resale, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: 'Grupo', active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
        prisma.company.create({ data: buildMinimalCompanyData() }),
      ]);
      const [client1, client2] = await Promise.all([
        prisma.client.create({
          data: {
            id: 2,
            type: 'PJ',
            document: '09748165000110',
            ie: null,
            groupId: group.id,
            resaleId: resale.id,
            companyId: company.id,
            companyName: 'Empresa 1',
            fantasyName: null,
            headquarters: 'SP',
            invoiceType: 'CONTRACT',
            generateInvoice: true,
            active: true,
          },
        }),
        prisma.client.create({
          data: {
            id: 3,
            type: 'PJ',
            document: '11111111000111',
            ie: null,
            groupId: group.id,
            resaleId: resale.id,
            companyId: company.id,
            companyName: 'Empresa 2',
            fantasyName: null,
            headquarters: 'RJ',
            invoiceType: 'CONTRACT',
            generateInvoice: true,
            active: true,
          },
        }),
      ]);
      const department = await prisma.department.create({
        data: { name: 'Departamento Com Contatos', active: true },
      });
      await prisma.clientContact.createMany({
        data: [
          {
            clientId: client1.id,
            departmentId: department.id,
            name: 'Contato 1',
            email: 'contato1@test.com',
            receiveNF: true,
            active: true,
          },
          {
            clientId: client2.id,
            departmentId: department.id,
            name: 'Contato 2',
            email: 'contato2@test.com',
            receiveNF: true,
            active: true,
          },
        ],
      });

      // Act
      const count = await sut.countClientContactsByDepartmentId(department.id);

      // Assert
      expect(count).toBe(2);
    });
  });
});
