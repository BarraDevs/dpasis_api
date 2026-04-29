import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { TOKENS } from 'src/core/di/token';
import type { IAuditLogDao } from '../../application/persistence/dao/audit-log-dao.interface';

const MUTATING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'secret', 'accessPassword'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(TOKENS.AuditLogDao) private readonly auditLogDao: IAuditLogDao,
  ) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, params } = request;

    if (!MUTATING_METHODS.includes(method)) {
      return next.handle();
    }

    const accountId: number | null = (request.user as Payload)?.sub ?? null;
    const ip = (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      ?? request.ip
      ?? null;
    const sanitizedBody = this.sanitizeBody(body);
    const sanitizedParams = Object.keys(params ?? {}).length > 0
      ? (params as Record<string, unknown>)
      : null;

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        this.saveLog({ accountId, method, url, params: sanitizedParams, body: sanitizedBody, statusCode, ip });
      }),
      // catchError((err: unknown) => {
      //   const statusCode = (err as any)?.code ?? (err as any)?.status ?? 500;
      //   this.saveLog({ accountId, method, url, params: sanitizedParams, body: sanitizedBody, statusCode, ip });
      //   return throwError(() => err);
      // }),
    );
  }

  private saveLog(data: Parameters<IAuditLogDao['save']>[0]): void {
    this.auditLogDao.save(data).catch(() => {
      // fire-and-forget: erros de auditoria não devem interromper a requisição
    });
  }

  private sanitizeBody(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    const sanitized = { ...(body as Record<string, unknown>) };
    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '****';
      }
    }
    return sanitized;
  }
}
