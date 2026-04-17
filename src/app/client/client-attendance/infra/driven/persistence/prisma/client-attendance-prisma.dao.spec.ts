import { Test } from '@nestjs/testing';
import { ClientAttendanceDto } from 'src/app/client/client-attendance/application/dtos/client-attendance.dto';
import { CreateClientAttendanceInputDto } from 'src/app/client/client-attendance/application/usecases/create-client-attendance/dtos/create-client-attendance.dto';
import { EditClientAttendanceInputDto } from 'src/app/client/client-attendance/application/usecases/edit-client-attendance/dtos/edit-client-attendance.dto';
import { FindAllClientAttendanceQueryDto } from 'src/app/client/client-attendance/application/usecases/find-all-client-attendance/dtos/find-all-client-attendance.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceDaoAdapterPrisma } from './client-attendance-prisma.dao';

describe('ClientAttendanceDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientAttendanceDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientAttendanceDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientAttendanceDaoAdapterPrisma);
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
    it('should return empty array when no client attendances exist', async() => {
      // Arrange
      const query: FindAllClientAttendanceQueryDto = {};

      // Act
      const [clientAttendances, total] = await sut.findAll(query);

      // Assert
      expect(clientAttendances).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all client attendances with default pagination', async() => {
      // Arrange
      await prisma.clientAttendance.createMany({
        data: [
          { name: `Tipo ${Date.now()}-1`, active: true },
          { name: `Tipo ${Date.now()}-2`, active: false },
        ],
      });
      const query: FindAllClientAttendanceQueryDto = {};

      // Act
      const [clientAttendances, total] = await sut.findAll(query);

      // Assert
      expect(clientAttendances).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.clientAttendance.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Tipo ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [clientAttendances, total] = await sut.findAll({ page: 1, size: 10 });
      const [clientAttendances2, total2] = await sut.findAll({ page: 3, size: 10 });
      const [clientAttendances3, total3] = await sut.findAll({ page: 4, size: 10 });

      // Assert
      expect(clientAttendances).toHaveLength(10);
      expect(total).toBe(25);
      expect(clientAttendances2).toHaveLength(5);
      expect(total2).toBe(25);
      expect(clientAttendances3).toHaveLength(0);
      expect(total3).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.clientAttendance.createMany({
        data: [
          { name: `Attendance Ativo ${Date.now()}`, active: true },
          { name: `Attendance Inativo ${Date.now()}`, active: false },
        ],
      });

      const [activeTypes, activeTotal] = await sut.findAll({ active: true });
      const [inactiveTypes, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeTypes).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeTypes[0].active).toBe(true);
      expect(inactiveTypes).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveTypes[0].active).toBe(false);
    });

    it('should search in name field (case-insensitive)', async() => {
      // Arrange
      await prisma.clientAttendance.createMany({
        data: [
          { name: `Suporte Técnico ${Date.now()}`, active: true },
          { name: `Suporte Comercial ${Date.now()}`, active: true },
        ],
      });
      const query: FindAllClientAttendanceQueryDto = { search: 'TÉCNICO' };

      // Act
      const [clientAttendances, total] = await sut.findAll(query);

      // Assert
      expect(clientAttendances).toHaveLength(1);
      expect(total).toBe(1);
      expect(clientAttendances[0].name).toContain('Técnico');
    });

    it('should return results ordered by name asc', async() => {
      // Arrange
      const ct1 = await prisma.clientAttendance.create({
        data: { name: `A-${Date.now()}`, active: true },
      });
      const ct2 = await prisma.clientAttendance.create({
        data: { name: `B-${Date.now()}`, active: true },
      });
      const query: FindAllClientAttendanceQueryDto = {};

      // Act
      const [clientAttendances] = await sut.findAll(query);

      // Assert
      expect(clientAttendances).toHaveLength(2);
      expect(clientAttendances[0].name).toBe(ct1.name);
      expect(clientAttendances[1].name).toBe(ct2.name);
    });

    it('should return all client attendance fields correctly', async() => {
      // Arrange
      const created = await prisma.clientAttendance.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });
      const query: FindAllClientAttendanceQueryDto = {};

      // Act
      const [clientAttendances] = await sut.findAll(query);

      // Assert
      expect(clientAttendances).toHaveLength(1);
      expect(clientAttendances[0]).toEqual<ClientAttendanceDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when client attendance does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return client attendance by id', async() => {
      // Arrange
      const created = await prisma.clientAttendance.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });

    it('should return all client attendance fields correctly', async() => {
      // Arrange
      const created = await prisma.clientAttendance.create({
        data: { name: `Tipo Test ${Date.now()}`, active: false },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual<ClientAttendanceDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findByName', () => {
    it('should return null when client attendance does not exist', async() => {
      // Arrange
      await prisma.clientAttendance.create({
        data: { name: `Tipo Test ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findByName('Tipo Inexistente');

      // Assert
      expect(result).toBeNull();
    });

    it('should return client attendance by name', async() => {
      // Arrange
      const name = `Suporte ${Date.now()}`;
      const created = await prisma.clientAttendance.create({
        data: { name, active: true },
      });

      // Act
      const result = await sut.findByName(created.name);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should find client attendance by name (case-insensitive)', async() => {
      // Arrange
      const name = `Suporte ${Date.now()}`;
      const created = await prisma.clientAttendance.create({
        data: { name, active: true },
      });

      // Act
      const result = await sut.findByName(name.toLowerCase());

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(created.active);
    });

    it('should return null if name is contained in another client attendance name', async() => {
      // Arrange
      await prisma.clientAttendance.create({
        data: { name: `Suporte 1 ${Date.now()}`, active: true },
      });
      await prisma.clientAttendance.create({
        data: { name: `Suporte 2 ${Date.now()}`, active: true },
      });

      // Act
      const result = await sut.findByName('Suporte');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create client attendance and return id', async() => {
      // Arrange
      const data: CreateClientAttendanceInputDto = {
        name: `Suporte Técnico ${Date.now()}`,
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientAttendance.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update client attendance name', async() => {
      // Arrange
      const clientAttendance = await prisma.clientAttendance.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });
      const data: EditClientAttendanceInputDto = { name: `Nome atualizado ${Date.now()}` };

      // Act
      await sut.edit(clientAttendance.id, data);

      // Assert
      const updated = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete client attendance from database', async() => {
      // Arrange
      const clientAttendance = await prisma.clientAttendance.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      // Act
      await sut.delete(clientAttendance.id);

      // Assert
      const deleted = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update client attendance status', async() => {
      // Arrange
      const clientAttendance = await prisma.clientAttendance.create({
        data: { name: `Tipo ${Date.now()}`, active: true },
      });

      // Act
      await sut.updateStatus(clientAttendance.id, false);

      // Assert
      const updated = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(clientAttendance.id, true);

      // Assert (again)
      const updated2 = await prisma.clientAttendance.findUnique({ where: { id: clientAttendance.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
