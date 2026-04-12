export interface IClientSequenceRepository {
  getCurrent(): Promise<number>;
  getAndIncrement(): Promise<number>;
  setNextId(value: number): Promise<void>;
  ensureNextIdIsAtLeast(minValue: number): Promise<void>;
}
