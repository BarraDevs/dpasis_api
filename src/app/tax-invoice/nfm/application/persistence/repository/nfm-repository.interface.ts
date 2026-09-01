import { Nfm } from 'src/app/tax-invoice/nfm/domain/entities/nfm.entity';

export interface INfmRepository {
  save(entity: Nfm): Promise<number>;
  edit(entity: Nfm): Promise<void>;
  findById(id: number): Promise<Nfm | null>;
  findByClientReferenceAndCnae(clientId: number, referenceMonth: number, referenceYear: number, cnaeNbsIndopId: number): Promise<Nfm | null>;
}
