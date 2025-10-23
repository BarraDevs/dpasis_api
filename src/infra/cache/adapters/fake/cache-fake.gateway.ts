/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ICacheGateway } from '../../cache.gateway';

@Injectable()
export class CacheFakeAdapterGateway implements ICacheGateway {
  public async set<T>(_key: string, _value: T, _ttlInSeconds?: number, _skipLog?: boolean): Promise<void> {}
  public async get<T>(_key: string): Promise<T | null> { return null; }
  public async delete(_key: string): Promise<void> {}
  public async deleteContaining(_key: string): Promise<void> {}
}
