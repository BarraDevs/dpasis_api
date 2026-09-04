import { NfsBatchErrorDto, NfsIssuedNoteDto } from './nfs-batch-status.dto';
import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';

export class FindNfsByRpsInputDto {
  /** Só para a trilha de tentativas; o provedor não recebe este campo. */
  nfseId?: number;
  rpsNumber: number;
  rpsSeries: string;
  /** `tsTipoRps` do ABRASF: 1 = RPS. O padrão do fluxo é 1. */
  rpsType?: number;
  providerDocument: string;
  providerMunicipalRegistration?: string;
  provider: NfsProviderCredentialsDto;
}

/**
 * Resposta binária: ou o provedor devolveu a nota, ou afirmou que ela não existe. É a única fonte
 * capaz de tirar uma NFS-e de `AWAITING_PROVIDER` — princípio 3 da §5.1 da auditoria.
 */
export class FindNfsByRpsOutputDto {
  found: boolean;
  note?: NfsIssuedNoteDto;
  errors?: NfsBatchErrorDto[];
}
