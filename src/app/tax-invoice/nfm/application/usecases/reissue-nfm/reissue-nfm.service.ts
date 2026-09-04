import { Inject, Injectable } from '@nestjs/common';
import { ReconcileNfse } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse/reconcile-nfse.service';
import { ReconcileNfseSource } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse/dtos/reconcile-nfse.dto';
import type { INfseRepository } from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from 'src/app/tax-invoice/nfse/application/queue/nfse-queue-producer.interface';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseAlreadyIssuedAtProviderError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-already-issued-at-provider.error';
import { NfseBatchStillProcessingError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-batch-still-processing.error';
import { NfseNotFoundError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-not-found.error';
import { NfseNotReissuableError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-not-reissuable.error';
import { NfseProviderQueryInconclusiveError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-provider-query-inconclusive.error';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { ReissueNfmInputDto, ReissueNfmOutputDto } from './dtos/reissue-nfm.dto';

/** Estados em que reemitir é uma decisão possível — §6: REJECTED ou AWAITING_PROVIDER. */
const REISSUABLE_STATUSES: NfseStatus[] = [
  NfseStatus.REJECTED,
  NfseStatus.AWAITING_PROVIDER,
];

@Injectable()
export class ReissueNfm {
  constructor(
    @Inject(TOKENS.NfmRepository) private readonly nfmRepository: INfmRepository,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly reconcileNfse: ReconcileNfse,
  ) {}

  /**
   * Reenvia o RPS de uma NFM depois de o cadastro ser corrigido.
   *
   * A rota **consulta o provedor ela mesma** antes de decidir: não basta o operador afirmar que
   * consultou (§9, R2 da auditoria). Se a nota existir lá, o estado local é corrigido e nada é
   * reenviado — reemitir sobre uma nota existente é o único erro irreversível deste fluxo.
   *
   * Quando o reenvio acontece, o RPS já reservado é reaproveitado. Um número novo é o que produz a
   * segunda NFS-e; o mesmo número é a chave de idempotência com a prefeitura.
   */
  public async execute(nfmId: number, input: ReissueNfmInputDto): Promise<ReissueNfmOutputDto> {
    const nfm = await this.nfmRepository.findById(nfmId);
    if (!nfm) {
      throw new NfmNotFoundError();
    }

    nfm.ensureHasNfse();
    const nfseId = nfm.props.nfse!.props.id;

    if (!REISSUABLE_STATUSES.includes(nfm.props.nfse!.props.status)) {
      throw new NfseNotReissuableError(nfm.props.nfse!.props.status);
    }

    const reconciled = await this.reconcileNfse.execute({ nfseId });
    if (reconciled.source === ReconcileNfseSource.ProviderIssued) {
      throw new NfseAlreadyIssuedAtProviderError(reconciled.nfseNumber ?? '');
    }

    const nfse = await this.nfseRepository.findById(nfseId);
    if (!nfse) {
      throw new NfseNotFoundError();
    }

    if (reconciled.source === ReconcileNfseSource.ProviderNotFoundPolling) {
      throw new NfseBatchStillProcessingError(nfse.props.batchProtocol ?? '');
    }
    if (reconciled.source === ReconcileNfseSource.NoOp) {
      throw new NfseNotReissuableError(nfse.props.status);
    }
    // A consulta não respondeu se a nota existe. Reenviar sem essa resposta é apostar contra uma
    // nota que pode estar emitida — o único erro irreversível deste fluxo.
    if (reconciled.source === ReconcileNfseSource.ProviderQueryFailed) {
      throw new NfseProviderQueryInconclusiveError(reconciled.message ?? 'motivo não informado pelo provedor');
    }

    this.logger.debug(LogContext.NFS_GENERATION, {
      adapter: 'nfm',
      action: 'reissueNfm',
      nfmId,
      nfseId,
      rpsNumber: nfse.props.rpsNumber,
      rpsSeries: nfse.props.rpsSeries,
      reason: input.reason,
    });

    // `ProviderNotFoundRequeued` significa que a reconciliação já devolveu a nota a `PENDING` e já
    // enfileirou: repetir aqui colocaria dois jobs para o mesmo RPS.
    if (reconciled.source !== ReconcileNfseSource.ProviderNotFoundRequeued) {
      nfse.resetForReissue();
      await this.nfseRepository.edit(nfse);
      await this.queueProducer.addIssueBatchJob({ nfseId });
    }

    return {
      nfseId,
      rpsNumber: nfse.props.rpsNumber,
      rpsSeries: nfse.props.rpsSeries,
      status: NfseStatus.PENDING,
    };
  }
}
