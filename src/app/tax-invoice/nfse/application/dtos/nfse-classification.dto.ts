import { NfseClassificationKind } from '../../domain/enums/nfse-classification-kind.enum';

export class NfseClassificationDto {
  id: number;
  companyId: number;
  rpsNumber: number;
  rpsSeries: string;
  kind: NfseClassificationKind;
  createdAt: Date;
  updatedAt: Date;
}
