import { Injectable } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';
import { ILoggerGateway, LogContext } from '../../logger.gateway';

@Injectable()
export class LoggerWinstonAdapterGateway implements ILoggerGateway {
  private readonly logger: Logger;

  private filterByContext(context: LogContext) {
    return format.combine(
      format(info => info.context === context ? info : false)(),
      format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
      format.json(),
    );
  }

  private generateTransport(context: LogContext) {
    return new transports.File({
      level: 'debug',
      filename: `logs/${context}.log`,
      format: this.filterByContext(context),
    });
  }

  constructor() {
    const transports = Object.values(LogContext).map(context => this.generateTransport(context));
    this.logger = createLogger({ transports });
  }

  public debug(context: LogContext, data: any): void {
    this.logger.log('debug', { context, data });
  }

  public error(context: LogContext, data: any): void {
    this.logger.log('error', { context, data });
  }
}
