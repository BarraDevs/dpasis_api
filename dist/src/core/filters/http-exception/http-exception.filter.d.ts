import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { AppException } from '../app.exception';
export declare class HttpExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
    private readonly logger;
    private readonly SENSITIVE_FIELDS;
    constructor(logger: ILoggerGateway);
    catch(exception: AppException, host: ArgumentsHost): void;
    private sanitizeBody;
    private isSensitiveField;
}
