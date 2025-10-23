export interface ICacheGateway {
  set<T>(key: string, value: T, ttlInSeconds?: number, skipLog?: boolean): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  deleteContaining(key: string): Promise<void>;
}
