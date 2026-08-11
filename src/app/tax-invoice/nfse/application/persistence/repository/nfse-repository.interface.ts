import { Nfse } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';

export interface INfseRepository {
  save(entity: Nfse): Promise<number>;
  edit(entity: Nfse): Promise<void>;
  findById(id: number): Promise<Nfse | null>;
}
