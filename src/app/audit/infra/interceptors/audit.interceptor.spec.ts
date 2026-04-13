import { createMock } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request, Response } from 'express';
import { of, throwError } from 'rxjs';
import { TOKENS } from 'src/core/di/token';
import { IAuditLogDao } from '../../application/persistence/dao/audit-log-dao.interface';
import { AuditInterceptor } from './audit.interceptor';

function buildContext(overrides: Partial<{
  method: string;
  url: string;
  body: unknown;
  params: Record<string, string>;
  headers: Record<string, string>;
  ip: string;
  userSub: number | null;
  statusCode: number;
}>): ExecutionContext {
  const {
    method = 'POST',
    url = '/admin/client',
    body = {},
    params = {},
    headers = {},
    ip = '10.0.0.1',
    userSub = null,
    statusCode = 201,
  } = overrides;

  const request = {
    method,
    url,
    body,
    params,
    headers,
    ip,
    user: userSub != null ? { sub: userSub } : undefined,
  } as unknown as Request;

  const response = { statusCode } as unknown as Response;

  const ctx = createMock<ExecutionContext>();
  ctx.switchToHttp().getRequest.mockReturnValue(request);
  ctx.switchToHttp().getResponse.mockReturnValue(response);
  return ctx;
}

describe('AuditInterceptor - Unit tests', () => {
  let sut: AuditInterceptor;
  let auditLogDao: IAuditLogDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        { provide: TOKENS.AuditLogDao, useValue: createMock<IAuditLogDao>() },
      ],
    }).compile();

    sut = module.get(AuditInterceptor);
    auditLogDao = module.get(TOKENS.AuditLogDao);
    jest.spyOn(auditLogDao, 'save').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('GET requests', () => {
    it('should not save audit log for GET requests', (done) => {
      const ctx = buildContext({ method: 'GET' });
      const next = createMock<CallHandler>();
      next.handle.mockReturnValue(of({}));

      sut.intercept(ctx, next).subscribe({
        complete: () => {
          expect(auditLogDao.save).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('mutating requests', () => {
    it.each(['POST', 'PATCH', 'PUT', 'DELETE'])('should save audit log for %s request', (method, done: jest.DoneCallback) => {
      const ctx = buildContext({ method });
      const next = createMock<CallHandler>();
      next.handle.mockReturnValue(of({}));

      sut.intercept(ctx, next).subscribe({
        complete: () => {
          expect(auditLogDao.save).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });

    it('should save log with correct data on success', (done) => {
      const ctx = buildContext({
        method: 'POST',
        url: '/admin/client',
        body: { companyName: 'Empresa' },
        params: {},
        ip: '192.168.1.1',
        userSub: 42,
        statusCode: 201,
      });
      const next = createMock<CallHandler>();
      next.handle.mockReturnValue(of({}));

      sut.intercept(ctx, next).subscribe({
        complete: () => {
          expect(auditLogDao.save).toHaveBeenCalledWith({
            accountId: 42,
            method: 'POST',
            url: '/admin/client',
            params: null,
            body: { companyName: 'Empresa' },
            statusCode: 201,
            ip: '192.168.1.1',
          });
          done();
        },
      });
    });

    it('should save log with null accountId when request has no user', (done) => {
      const ctx = buildContext({ method: 'POST', userSub: null });
      const next = createMock<CallHandler>();
      next.handle.mockReturnValue(of({}));

      sut.intercept(ctx, next).subscribe({
        complete: () => {
          expect(auditLogDao.save).toHaveBeenCalledWith(
            expect.objectContaining({ accountId: null }),
          );
          done();
        },
      });
    });

    it('should save log with params when request has path params', (done) => {
      const ctx = buildContext({
        method: 'DELETE',
        url: '/admin/client/5',
        params: { id: '5' },
      });
      const next = createMock<CallHandler>();
      next.handle.mockReturnValue(of({}));

      sut.intercept(ctx, next).subscribe({
        complete: () => {
          expect(auditLogDao.save).toHaveBeenCalledWith(
            expect.objectContaining({ params: { id: '5' } }),
          );
          done();
        },
      });
    });

    it('should use X-Forwarded-For header when present', (done) => {
      const ctx = buildContext({
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
        ip: '10.0.0.1',
      });
      const next = createMock<CallHandler>();
      next.handle.mockReturnValue(of({}));

      sut.intercept(ctx, next).subscribe({
        complete: () => {
          expect(auditLogDao.save).toHaveBeenCalledWith(
            expect.objectContaining({ ip: '203.0.113.5' }),
          );
          done();
        },
      });
    });

    it('should sanitize sensitive fields in body', (done) => {
      const ctx = buildContext({
        method: 'POST',
        body: { email: 'test@example.com', password: 'secret123', token: 'abc' },
      });
      const next = createMock<CallHandler>();
      next.handle.mockReturnValue(of({}));

      sut.intercept(ctx, next).subscribe({
        complete: () => {
          expect(auditLogDao.save).toHaveBeenCalledWith(
            expect.objectContaining({
              body: { email: 'test@example.com', password: '****', token: '****' },
            }),
          );
          done();
        },
      });
    });

    it('should re-throw the error after saving log', (done) => {
      const ctx = buildContext({ method: 'POST' });
      const next = createMock<CallHandler>();
      const error = new Error('Something went wrong');
      next.handle.mockReturnValue(throwError(() => error));

      sut.intercept(ctx, next).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should not fail the request if audit save throws', (done) => {
      jest.spyOn(auditLogDao, 'save').mockRejectedValue(new Error('DB down'));

      const ctx = buildContext({ method: 'POST' });
      const next = createMock<CallHandler>();
      next.handle.mockReturnValue(of({ id: 1 }));

      sut.intercept(ctx, next).subscribe({
        next: (value) => {
          expect(value).toEqual({ id: 1 });
        },
        complete: () => {
          done();
        },
        error: () => {
          done(new Error('Should not have errored'));
        },
      });
    });
  });
});
