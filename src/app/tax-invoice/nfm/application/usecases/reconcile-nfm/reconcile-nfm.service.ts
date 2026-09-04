import { Inject, Injectable } from '@nestjs/common';
import { ReconcileNfse } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse/reconcile-nfse.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { ReconcileNfmInputDto, ReconcileNfmOutputDto } from './dtos/reconcile-nfm.dto';

@Injectable()
export class ReconcileNfm {
  constructor(
    @Inject(TOKENS.NfmRepository) private readonly nfmRepository: INfmRepository,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly reconcileNfse: ReconcileNfse,
  ) {}

  /**
   * Reconciliação sob demanda da NFS-e de uma NFM: consulta o provedor pela chave natural do RPS e
   * corrige o estado local com o que ele responder — inclusive tirando a nota de `FAILED` ou
   * `AWAITING_PROVIDER` para `ISSUED`. Nunca inventa dados.
   */
  public async execute(nfmId: number, input: ReconcileNfmInputDto): Promise<ReconcileNfmOutputDto> {
    const nfm = await this.nfmRepository.findById(nfmId);
    if (!nfm) {
      throw new NfmNotFoundError();
    }

    nfm.ensureHasNfse();

    this.logger.debug(LogContext.NFS_GENERATION, {
      adapter: 'nfm',
      action: 'reconcileNfm',
      nfmId,
      nfseId: nfm.props.nfse!.props.id,
      reason: input.reason,
    });

    return this.reconcileNfse.execute({ nfseId: nfm.props.nfse!.props.id });
  }
}
