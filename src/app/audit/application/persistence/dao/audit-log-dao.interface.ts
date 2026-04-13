import { AuditLogDto } from '../../dtos/audit-log.dto';
import { FindAllAuditLogQueryDto } from '../../usecases/find-all-audit-log/dtos/find-all-audit-log.dto';

export type CreateAuditLogData = {
  accountId: number | null;
  method: string;
  url: string;
  params: Record<string, unknown> | null;
  body: Record<string, unknown> | null;
  statusCode: number;
  ip: string | null;
};

export interface IAuditLogDao {
  save(data: CreateAuditLogData): Promise<void>;
  findAll(queries: FindAllAuditLogQueryDto): Promise<[AuditLogDto[], number]>;
}
