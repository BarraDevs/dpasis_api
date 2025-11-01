import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Inject } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { TOKENS } from 'src/core/di/token';
import { type ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import { AppException } from '../app.exception';

@Catch(AppException)
export class HttpExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  private readonly SENSITIVE_FIELDS = [
    'password',
  ];

  constructor(@Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway) {
    super();
  }

  public catch(exception: AppException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    this.logger.error(LogContext.HTTP, {
      accountId: (request?.user as any)?.sub,
      method: request.method,
      url: request.url,
      body: this.sanitizeBody(request.body),
      params: request.params,
      query: request.query,
      statusCode: exception.code ?? HttpStatus.BAD_REQUEST,
      error: exception.message,
    });

    response
      .status(exception.code ?? HttpStatus.BAD_REQUEST)
      .json({ message: exception.message });
  }

  private sanitizeBody(body: any): any {
    if (Array.isArray(body)) {
      return body.map((item) => this.sanitizeBody(item));
    }

    if (body && typeof body === 'object') {
      const sanitized: Record<string, any> = {};

      for (const key of Object.keys(body)) {
        if (this.isSensitiveField(key)) {
          sanitized[key] = '****';
        } else {
          sanitized[key] = this.sanitizeBody(body[key]);
        }
      }

      return sanitized;
    }

    return body;
  }

  private isSensitiveField(field: string): boolean {
    return this.SENSITIVE_FIELDS.includes(field.toLowerCase());
  }
}

