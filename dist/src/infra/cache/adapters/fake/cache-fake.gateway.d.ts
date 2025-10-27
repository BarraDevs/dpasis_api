import { ICacheGateway } from '../../cache.gateway';
export declare class CacheFakeAdapterGateway implements ICacheGateway {
    set<T>(_key: string, _value: T, _ttlInSeconds?: number, _skipLog?: boolean): Promise<void>;
    get<T>(_key: string): Promise<T | null>;
    delete(_key: string): Promise<void>;
    deleteContaining(_key: string): Promise<void>;
}
