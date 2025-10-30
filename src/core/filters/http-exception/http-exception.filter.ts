import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Inject } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { AddressMainCannotBeDeletedError } from 'src/app/address/domain/errors/address-main-cannot-be-deleted.error';
import { AddressMainMustBeOneError } from 'src/app/address/domain/errors/address-main-must-be-one.error';
import { AddressNotFoundError } from 'src/app/address/domain/errors/address-not-found.error';
import { ForbiddenAccountError } from 'src/app/authentication/application/errors/forbidden-account.error';
import { InactiveAccountError } from 'src/app/authentication/application/errors/inactive-account.error';
import { InvalidCredentialError } from 'src/app/authentication/application/errors/invalid-credential.error';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found';
import { ClientDuplicateCnpjError } from 'src/app/client/domain/errors/duplicate-cnpj.error';
import { ClientDuplicateIeError } from 'src/app/client/domain/errors/duplicate-ie.error';
import { ContactNotFoundError } from 'src/app/contact/domain/errors/contact-not-found.error';
import { LicenseNotFoundError } from 'src/app/license/domain/errors/license-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { type ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import { InvalidDateError, InvalidDaysQuantityError, InvalidMonthsQuantityError } from 'src/shared/value-objects/utc-date/utc-date.error';
import { AppException } from '../app.exception';

@Catch(
  ForbiddenAccountError,
  InactiveAccountError,
  InvalidCredentialError,

  AddressNotFoundError,
  AddressMainCannotBeDeletedError,
  AddressMainMustBeOneError,

  ClientNotFoundError,
  ClientDuplicateCnpjError,
  ClientDuplicateIeError,

  ContactNotFoundError,

  LicenseNotFoundError,


  InvalidDateError,
  InvalidDaysQuantityError,
  InvalidMonthsQuantityError,
)
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

