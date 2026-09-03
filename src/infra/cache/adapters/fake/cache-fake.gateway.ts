/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ICacheGateway } from '../../cache.gateway';

@Injectable()
export class CacheFakeAdapterGateway implements ICacheGateway {
  /** Público para os testes limparem entre casos, como os demais fakes de infra. */
  public readonly claimedKeys = new Set<string>();

  public async set<T>(_key: string, _value: T, _ttlInSeconds?: number, _skipLog?: boolean): Promise<void> {}
  public async get<T>(_key: string): Promise<T | null> { return null; }

  /** Com estado, porque o valor deste método é justamente recusar a segunda chamada. */
  public async setIfAbsent<T>(key: string, _value: T, _ttlInSeconds: number): Promise<boolean> {
    if (this.claimedKeys.has(key)) {
      return false;
    }
    this.claimedKeys.add(key);
    return true;
  }
  public async delete(_key: string): Promise<void> {}
  public async deleteContaining(_key: string): Promise<void> {}
}
