export class AuditLogDto {
  id: number;
  accountId: number | null;
  method: string;
  url: string;
  params: Record<string, unknown> | null;
  body: Record<string, unknown> | null;
  statusCode: number;
  ip: string | null;
  createdAt: Date;
}
