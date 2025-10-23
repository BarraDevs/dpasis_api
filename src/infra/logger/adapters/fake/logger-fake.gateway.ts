/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ILoggerGateway, LogContext } from '../../logger.gateway';

@Injectable()
export class LoggerFakeAdapterGateway implements ILoggerGateway {
  public debug(_context: LogContext, _data: any): void {}
  public error(_context: LogContext, _data: any): void {}
}
