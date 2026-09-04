import { NfsBatchErrorDto, NfsIssuedNoteDto } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';

export class FindNfmProviderStatusOutputDto {
  nfseId: number;
  rpsNumber: number;
  rpsSeries: string;
  /** O que o provedor respondeu agora, sem nenhuma escrita local. */
  found: boolean;
  note?: NfsIssuedNoteDto;
  errors?: NfsBatchErrorDto[];
  consultedAt: Date;
}
