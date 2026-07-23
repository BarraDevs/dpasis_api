import { NfseCreateProps, NfseProps } from '../../../domain/entities/nfse.entity';
import { NfseDto } from '../../dtos/nfse.dto';

export type UpdateNfseStatusData = Partial<Pick<NfseProps,
  'status' | 'batchProtocol' | 'nfseNumber' | 'verificationCode' | 'issuedAt' | 'errorMessage'
>>;

export interface INfseDao {
  findById(id: number): Promise<NfseDto | null>;
  save(props: NfseCreateProps): Promise<number>;
  updateStatus(id: number, patch: UpdateNfseStatusData): Promise<void>;
}
