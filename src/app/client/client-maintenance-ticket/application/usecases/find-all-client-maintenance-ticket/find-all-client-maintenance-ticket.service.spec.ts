import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientMaintenanceTicketModule } from '../../../client-maintenance-ticket.module';
import { ClientMaintenanceTicketDto } from '../../dtos/client-maintenance-ticket.dto';
import { FindAllClientMaintenanceTicketQueryDto } from './dtos/find-all-client-maintenance-ticket.dto';
import { FindAllClientMaintenanceTicket } from './find-all-client-maintenance-ticket.service';

describe('FindAllClientMaintenanceTicket - Integration tests', () => {
  let sut: FindAllClientMaintenanceTicket;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientMaintenanceTicketModule],
    }).compile();

    sut = module.get(FindAllClientMaintenanceTicket);
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

  it('should return empty results when no client maintenance tickets exist', async() => {
    // Arrange
    const query: FindAllClientMaintenanceTicketQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client maintenance tickets with pagination', async() => {
    // Arrange
    await prisma.clientMaintenanceTicket.createMany({
      data: [
        { name: `Nome 1 ${Date.now()}`, active: true },
        { name: `Nome 2 ${Date.now()}`, active: false },
        { name: `Nome 3 ${Date.now()}`, active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    // Arrange
    await prisma.clientMaintenanceTicket.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Nome ${Date.now()}-${i + 1}`,
        active: true,
      })),
    });

    // Act
    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    // Assert
    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by name asc', async() => {
    // Arrange
    const first = await prisma.clientMaintenanceTicket.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.clientMaintenanceTicket.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.clientMaintenanceTicket.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    // Arrange
    await prisma.clientMaintenanceTicket.createMany({
      data: [
        { name: `Nome A ${Date.now()}`, active: true },
        { name: `Nome B ${Date.now()}`, active: false },
        { name: `Nome C ${Date.now()}`, active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: true });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientMaintenanceTicketDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    // Arrange
    await prisma.clientMaintenanceTicket.createMany({
      data: [
        { name: `Nome A ${Date.now()}`, active: true },
        { name: `Nome B ${Date.now()}`, active: false },
        { name: `Nome C ${Date.now()}`, active: false },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: false });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientMaintenanceTicketDto) => !d.active)).toBe(true);
  });

  it('should filter by search in name', async() => {
    // Arrange
    await prisma.clientMaintenanceTicket.createMany({
      data: [
        { name: `Manutenção Preventiva ${Date.now()}`, active: true },
        { name: `Manutenção Corretiva ${Date.now()}`, active: true },
        { name: `Manutenção Preventiva VIP ${Date.now()}`, active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'Preventiva' });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientMaintenanceTicketDto) => d.name.toLowerCase().includes('preventiva'))).toBe(true);
  });

  it('should return correct ClientMaintenanceTicketDto structure', async() => {
    // Arrange
    const clientMaintenanceTicket = await prisma.clientMaintenanceTicket.create({
      data: { name: `Nome Test ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<ClientMaintenanceTicketDto>({
      id: clientMaintenanceTicket.id,
      name: clientMaintenanceTicket.name,
      active: clientMaintenanceTicket.active,
      createdAt: clientMaintenanceTicket.createdAt,
      updatedAt: clientMaintenanceTicket.updatedAt,
    });
  });
});
