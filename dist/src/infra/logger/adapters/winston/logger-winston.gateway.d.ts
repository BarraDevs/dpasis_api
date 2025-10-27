import { ILoggerGateway, LogContext } from '../../logger.gateway';
export declare class LoggerWinstonAdapterGateway implements ILoggerGateway {
    private readonly logger;
    private filterByContext;
    private generateTransport;
    constructor();
    debug(context: LogContext, data: any): void;
    error(context: LogContext, data: any): void;
}
