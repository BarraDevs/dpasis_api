export interface INfseRpsSequenceRepository {
  getAndIncrement(companyId: number): Promise<number>;
}
