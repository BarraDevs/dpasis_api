import { NfseDto } from '../../dtos/nfse.dto';

export interface INfseDao {
  findById(id: number): Promise<NfseDto | null>;
}
