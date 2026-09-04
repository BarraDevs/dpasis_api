import { NfsBatchErrorDto, NfsIssuedNoteDto } from './nfs-batch-status.dto';
import { NfsProviderCredentialsDto } from './nfs-provider-credentials.dto';

export class ListIssuedNfsInputDto {
  /** Datas de emissão, `yyyy-MM-dd`. O provedor filtra por `PeriodoEmissao`. */
  startDate: string;
  endDate: string;
  /** Página, começando em 1. Obrigatória no XSD. */
  page: number;
  providerDocument: string;
  providerMunicipalRegistration?: string;
  provider: NfsProviderCredentialsDto;
}

export class ListIssuedNfsOutputDto {
  notes: NfsIssuedNoteDto[];
  /**
   * O provedor sinaliza o fim da paginação com erro (`E212`), não com lista vazia. Sem este flag um
   * laço de paginação ou quebra na última página ou gira para sempre.
   */
  endOfPages: boolean;
  errors?: NfsBatchErrorDto[];
}
