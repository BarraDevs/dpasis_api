import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AuditLogDaoAdapterPrisma } from './audit-log-prisma.dao';

describe('AuditLogDaoAdapterPrisma - Integration tests', () => {
  let sut: AuditLogDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [AuditLogDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(AuditLogDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.auditLog.deleteMany();
  });

  afterAll(async() => {
    await prisma.auditLog.deleteMany();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should persist an audit log entry', async() => {
      await sut.save({
        accountId: 1,
        method: 'POST',
        url: '/admin/client',
        params: null,
        body: { companyName: 'Empresa Test' },
        statusCode: 201,
        ip: '127.0.0.1',
      });

      const [logs, total] = await sut.findAll({});
      expect(total).toBe(1);
      expect(logs[0].method).toBe('POST');
      expect(logs[0].url).toBe('/admin/client');
      expect(logs[0].statusCode).toBe(201);
      expect(logs[0].accountId).toBe(1);
      expect(logs[0].ip).toBe('127.0.0.1');
    });

    it('should persist with null accountId and null params/body', async() => {
      await sut.save({
        accountId: null,
        method: 'DELETE',
        url: '/admin/client/1',
        params: { id: '1' },
        body: null,
        statusCode: 200,
        ip: null,
      });

      const [logs] = await sut.findAll({});
      expect(logs[0].accountId).toBeNull();
      expect(logs[0].ip).toBeNull();
      expect(logs[0].body).toBeNull();
      expect(logs[0].params).toEqual({ id: '1' });
    });
  });

  describe('findAll', () => {
    beforeEach(async() => {
      await Promise.all([
        prisma.auditLog.create({
          data: { accountId: 1, method: 'POST', url: '/admin/client', statusCode: 201, createdAt: new Date('2025-01-10') },
        }),
        prisma.auditLog.create({
          data: { accountId: 2, method: 'PATCH', url: '/admin/client/5', statusCode: 200, createdAt: new Date('2025-02-15') },
        }),
        prisma.auditLog.create({
          data: { accountId: 1, method: 'DELETE', url: '/admin/client/5', statusCode: 200, createdAt: new Date('2025-03-20') },
        }),
      ]);
    });

    it('should return all logs with total when no filters applied', async() => {
      const [logs, total] = await sut.findAll({});

      expect(total).toBe(3);
      expect(logs).toHaveLength(3);
    });

    it('should return logs ordered by createdAt desc', async() => {
      const [logs] = await sut.findAll({});

      expect(logs[0].method).toBe('DELETE');
      expect(logs[1].method).toBe('PATCH');
      expect(logs[2].method).toBe('POST');
    });

    it('should filter by accountId', async() => {
      const [logs, total] = await sut.findAll({ accountId: 1 });

      expect(total).toBe(2);
      expect(logs.every((l) => l.accountId === 1)).toBe(true);
    });

    it('should filter by method', async() => {
      const [logs, total] = await sut.findAll({ method: 'PATCH' });

      expect(total).toBe(1);
      expect(logs[0].method).toBe('PATCH');
    });

    it('should filter by search in url (case-insensitive)', async() => {
      const [logs, total] = await sut.findAll({ search: 'CLIENT/5' });

      expect(total).toBe(2);
      expect(logs.every((l) => l.url.includes('/client/5'))).toBe(true);
    });

    it('should filter by startDate', async() => {
      const [logs, total] = await sut.findAll({ startDate: '2025-02-01' });

      expect(total).toBe(2);
      expect(logs.every((l) => l.createdAt >= new Date('2025-02-01'))).toBe(true);
    });

    it('should filter by endDate', async() => {
      const [logs, total] = await sut.findAll({ endDate: '2025-02-28' });

      expect(total).toBe(2);
      expect(logs.every((l) => l.createdAt <= new Date('2025-02-28'))).toBe(true);
    });

    it('should combine multiple filters', async() => {
      const [logs, total] = await sut.findAll({
        accountId: 1,
        startDate: '2025-03-01',
      });

      expect(total).toBe(1);
      expect(logs[0].method).toBe('DELETE');
    });

    it('should paginate results correctly', async() => {
      const [logs, total] = await sut.findAll({ page: 1, size: 2 });

      expect(total).toBe(3);
      expect(logs).toHaveLength(2);
    });

    it('should return empty array when no logs match filters', async() => {
      const [logs, total] = await sut.findAll({ accountId: 999 });

      expect(total).toBe(0);
      expect(logs).toEqual([]);
    });
  });
});
