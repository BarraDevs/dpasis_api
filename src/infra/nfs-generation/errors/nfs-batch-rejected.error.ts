import { AppException } from 'src/core/filters/app.exception';
import { NfsBatchErrorDto, NfsBatchErrorKind } from '../dtos/nfs-batch-status.dto';

/**
 * O provedor recusou o lote na própria recepção, devolvendo códigos de erro em vez de um protocolo.
 *
 * Existe para preservar os erros como dado estruturado (com `kind` normalizado pelo adapter).
 * A distinção entre rejeição de negócio (permanente) e "RPS já informado" (a nota provavelmente
 * existe) vive em `alreadySubmitted` — o use case não precisa conhecer códigos de vendor.
 */
export class NfsBatchRejectedError extends AppException {
  public readonly errors: NfsBatchErrorDto[];

  constructor(errors: NfsBatchErrorDto[]) {
    super(NfsBatchRejectedError.buildMessage(errors), 400);
    this.name = 'NfsBatchRejectedError';
    this.errors = errors;
  }

  public get alreadySubmitted(): boolean {
    return this.errors.some(error => error.kind === NfsBatchErrorKind.AlreadySubmitted);
  }

  private static buildMessage(errors: NfsBatchErrorDto[]): string {
    if (errors.length === 0) {
      return 'Lote rejeitado pelo provedor de NFS-e sem detalhes na resposta';
    }
    return errors.map(error => `${error.code}: ${error.message}`).join('; ');
  }
}
