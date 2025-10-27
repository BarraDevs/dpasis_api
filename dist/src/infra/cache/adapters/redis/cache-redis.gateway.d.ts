import type { RedisClientType } from 'redis';
import { type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ICacheGateway } from '../../cache.gateway';
export declare class CacheRedisAdapterGateway implements ICacheGateway {
    private readonly redisClient;
    private readonly logger;
    private readonly ONE_DAY_IN_SECONDS;
    constructor(redisClient: RedisClientType, logger: ILoggerGateway);
    set<T>(key: string, value: T, ttlInSeconds?: number, skipLog?: boolean): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    delete(key: string): Promise<void>;
    deleteContaining(key: string): Promise<void>;
}
