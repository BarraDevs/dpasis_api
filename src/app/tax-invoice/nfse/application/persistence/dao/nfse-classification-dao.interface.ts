import { NfseClassificationKind } from '../../../domain/enums/nfse-classification-kind.enum';
import { NfseClassificationDto } from '../../dtos/nfse-classification.dto';

export type NfseClassificationUpsertItem = {
  rpsNumber: number;
  rpsSeries: string;
  kind: NfseClassificationKind;
};

export type NfseClassificationRpsKey = {
  rpsNumber: number;
  rpsSeries: string;
};

export interface INfseClassificationDao {
  upsertMany(companyId: number, items: NfseClassificationUpsertItem[]): Promise<void>;
  findByRpsKeys(companyId: number, keys: NfseClassificationRpsKey[]): Promise<NfseClassificationDto[]>;
}
