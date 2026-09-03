export interface ICacheGateway {
  set<T>(key: string, value: T, ttlInSeconds?: number, skipLog?: boolean): Promise<void>;
  /**
   * Grava só se a chave ainda não existir, e devolve se a gravação aconteceu. Atômico (`SET NX`),
   * ao contrário de `get` seguido de `set` — é o que permite duas instâncias disputarem a mesma
   * janela sem as duas ganharem.
   */
  setIfAbsent<T>(key: string, value: T, ttlInSeconds: number): Promise<boolean>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  deleteContaining(key: string): Promise<void>;
}
