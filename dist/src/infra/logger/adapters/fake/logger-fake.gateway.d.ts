import { ILoggerGateway, LogContext } from '../../logger.gateway';
export declare class LoggerFakeAdapterGateway implements ILoggerGateway {
    debug(_context: LogContext, _data: any): void;
    error(_context: LogContext, _data: any): void;
}
