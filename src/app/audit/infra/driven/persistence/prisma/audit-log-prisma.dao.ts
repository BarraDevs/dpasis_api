import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLogDto } from 'src/app/audit/application/dtos/audit-log.dto';
import { CreateAuditLogData, IAuditLogDao } from 'src/app/audit/application/persistence/dao/audit-log-dao.interface';
import { FindAllAuditLogQueryDto } from 'src/app/audit/application/usecases/find-all-audit-log/dtos/find-all-audit-log.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const AuditLogSelect = {
  id: true,
  accountId: true,
  method: true,
  url: true,
  params: true,
  body: true,
  statusCode: true,
  ip: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

@Injectable()
export class AuditLogDaoAdapterPrisma implements IAuditLogDao {
  constructor(private readonly prisma: PrismaService) {}

  public async save(data: CreateAuditLogData): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        ...data,
        params: data.params != null ? (data.params as Prisma.InputJsonValue) : Prisma.JsonNull,
        body: data.body != null ? (data.body as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  public async findAll(queries: FindAllAuditLogQueryDto): Promise<[AuditLogDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.AuditLogWhereInput[] = [];

    if (queries.accountId != null) {
      conditions.push({ accountId: queries.accountId });
    }

    if (queries.method) {
      conditions.push({ method: queries.method });
    }

    if (queries.search?.trim()) {
      conditions.push({ url: { contains: queries.search.trim(), mode: 'insensitive' } });
    }

    if (queries.startDate) {
      conditions.push({ createdAt: { gte: new Date(queries.startDate) } });
    }

    if (queries.endDate) {
      conditions.push({ createdAt: { lte: new Date(queries.endDate) } });
    }

    const where: Prisma.AuditLogWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        select: AuditLogSelect,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return [logs as AuditLogDto[], total];
  }
}
