import { Test } from '@nestjs/testing';
import { AuditModule } from 'src/app/audit/audit.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AuditLogDto } from '../../dtos/audit-log.dto';
import { FindAllAuditLog } from './find-all-audit-log.service';

describe('FindAllAuditLog - Integration tests', () => {
  let sut: FindAllAuditLog;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [AuditModule],
    }).compile();

    sut = module.get(FindAllAuditLog);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function seedLogs(): Promise<void> {
    await prisma.auditLog.create({
      data: { accountId: 1, method: 'POST', url: '/admin/client', statusCode: 201, createdAt: new Date('2025-01-10') },
    });
    await prisma.auditLog.create({
      data: { accountId: 2, method: 'PATCH', url: '/admin/client/5', statusCode: 200, createdAt: new Date('2025-02-15') },
    });
    await prisma.auditLog.create({
      data: { accountId: 1, method: 'DELETE', url: '/admin/client/5', statusCode: 200, createdAt: new Date('2025-03-20') },
    });
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty results when no audit logs exist', async() => {
    // Arrange
    // Act
    const result = await sut.execute({});

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all audit logs with pagination', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should order by createdAt desc', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0].method).toBe('DELETE');
    expect(result.data[1].method).toBe('PATCH');
    expect(result.data[2].method).toBe('POST');
  });

  it('should paginate results correctly', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({ page: 1, size: 2 });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it('should filter by accountId', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({ accountId: 1 });

    // Assert
    expect(result.totalItems).toBe(2);
    expect(result.data.every((log) => log.accountId === 1)).toBe(true);
  });

  it('should filter by method', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({ method: 'PATCH' });

    // Assert
    expect(result.totalItems).toBe(1);
    expect(result.data[0].method).toBe('PATCH');
  });

  it('should filter by search in url (case-insensitive)', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({ search: 'CLIENT/5' });

    // Assert
    expect(result.totalItems).toBe(2);
    expect(result.data.every((log) => log.url.includes('/client/5'))).toBe(true);
  });

  it('should filter by startDate', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({ startDate: '2025-02-01' });

    // Assert
    expect(result.totalItems).toBe(2);
    expect(result.data.every((log) => log.createdAt >= new Date('2025-02-01'))).toBe(true);
  });

  it('should filter by endDate', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({ endDate: '2025-02-28' });

    // Assert
    expect(result.totalItems).toBe(2);
    expect(result.data.every((log) => log.createdAt <= new Date('2025-02-28'))).toBe(true);
  });

  it('should combine multiple filters', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({
      accountId: 1,
      startDate: '2025-03-01',
    });

    // Assert
    expect(result.totalItems).toBe(1);
    expect(result.data[0].method).toBe('DELETE');
  });

  it('should return empty when no logs match filters', async() => {
    // Arrange
    await seedLogs();

    // Act
    const result = await sut.execute({ accountId: 999 });

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return correct AuditLogDto structure', async() => {
    // Arrange
    const log = await prisma.auditLog.create({
      data: {
        accountId: 1,
        method: 'POST',
        url: '/admin/client',
        params: { id: '1' },
        body: { companyName: 'Empresa Test' },
        statusCode: 201,
        ip: '127.0.0.1',
      },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<AuditLogDto>({
      id: log.id,
      accountId: log.accountId,
      method: log.method,
      url: log.url,
      params: log.params as Record<string, unknown>,
      body: log.body as Record<string, unknown>,
      statusCode: log.statusCode,
      ip: log.ip,
      createdAt: log.createdAt,
    });
  });
});
