import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AuditLogDto } from '../../dtos/audit-log.dto';
import type { IAuditLogDao } from '../../persistence/dao/audit-log-dao.interface';
import { FindAllAuditLogQueryDto } from './dtos/find-all-audit-log.dto';

@Injectable()
export class FindAllAuditLog {
  constructor(
    @Inject(TOKENS.AuditLogDao) private readonly auditLogDao: IAuditLogDao,
  ) {}

  public async execute(queries: FindAllAuditLogQueryDto): Promise<IPagination<AuditLogDto>> {
    const [result, total] = await this.auditLogDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
