import { Inject, Injectable } from '@nestjs/common';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { FindNfsByRpsOutputDto } from 'src/infra/nfs-generation/dtos/find-nfs-by-rps.dto';
import { NfsBatchErrorKind, NfsIssuedNoteDto } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { Nfse } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ReconcileNfseInputDto, ReconcileNfseOutputDto, ReconcileNfseSource } from './dtos/reconcile-nfse.dto';

/**
 * Escada de reconsulta ao provedor. Começa curta porque a maioria das ambiguidades se resolve em
 * minutos (prefeitura lenta, lote na fila) e termina diária porque as que sobram são
 * indisponibilidade longa — perguntar de hora em hora durante dias só gera carga.
 */
const RECONCILE_DELAYS_MS = [
  300_000, // 5min
  900_000, // 15min
  3_600_000, // 1h
  21_600_000, // 6h
  86_400_000, // 24h
];

const ONE_DAY_IN_MS = 86_400_000;

/**
 * O cancelamento de NFS-e tem prazo de 30 dias contados da **emissão**, não da descoberta. Aos 25
 * dias a nota para de ser reagendada e passa a exigir decisão humana enquanto ainda há margem: se a
 * reconciliação descobrir a nota emitida no dia 28, restam 2 dias, não 30.
 */
const RECONCILE_DEADLINE_IN_DAYS = 25;

@Injectable()
export class ReconcileNfse {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
    private readonly recordJobAudit: RecordJobAudit,
  ) {}

  /**
   * Toda reconciliação vira uma linha de auditoria, inclusive a que não muda nada: a pergunta
   * operacional costuma ser "o sistema chegou a olhar esta nota?", e a resposta não pode depender de
   * ler log.
   */
  public async execute(input: ReconcileNfseInputDto): Promise<ReconcileNfseOutputDto> {
    const result = await this.resolve(input);

    this.recordJobAudit.record({
      jobName: 'reconcile-nfse',
      nfseId: result.nfseId,
      from: result.previousStatus,
      to: result.newStatus,
      reason: [result.source, result.nfseNumber ? `NFS-e ${result.nfseNumber}` : null, result.message]
        .filter(Boolean)
        .join(' · '),
      succeeded: result.source !== ReconcileNfseSource.ProviderQueryFailed,
    });

    return result;
  }

  /**
   * Pergunta ao provedor, pela chave natural do RPS, o que aconteceu com a nota — e grava só o que
   * ele responder. É o único caminho de saída de `AWAITING_PROVIDER`: nem o estado local nem o
   * tempo decorrido autorizam afirmar que a nota não existe.
   */
  private async resolve(input: ReconcileNfseInputDto): Promise<ReconcileNfseOutputDto> {
    const nfse = await this.nfseRepository.findById(input.nfseId);
    if (!nfse) {
      throw new NfseNotFoundError();
    }

    const previousStatus = nfse.props.status;

    if (nfse.isIssued() || nfse.isCanceled()) {
      return this.noOp(nfse, previousStatus);
    }

    const result = await this.queryProvider(nfse);

    if (result.found && result.note) {
      return this.applyIssued(nfse, previousStatus, result.note);
    }

    // Um erro de consulta **não** é uma resposta sobre a nota. `ConsultarNfsePorRps` devolve um
    // `xsd:choice` entre `CompNfse` e `ListaMensagemRetorno`, e as mensagens desse ramo falam da
    // consulta — inscrição municipal errada, prestador desconhecido, indisponibilidade. Só `E89` e
    // `E212` afirmam que a nota não existe. Tratar as demais como rejeição do fisco marcaria
    // `REJECTED` (terminal) uma nota que talvez exista — o mesmo `FAILED` mentiroso que esta
    // reconciliação existe para desfazer. Quem prova rejeição de negócio é a emissão: a recepção do
    // lote e a situação 3 da consulta do lote, que já marcam `REJECTED` no caminho de emissão.
    const inconclusive = result.errors?.filter((error) => error.kind !== NfsBatchErrorKind.NotFound) ?? [];
    if (inconclusive.length > 0) {
      return this.applyQueryFailed(nfse, previousStatus, inconclusive.map((e) => `${e.code}: ${e.message}`).join('; '));
    }

    return this.applyNotFound(nfse, previousStatus);
  }

  private async queryProvider(nfse: Nfse): Promise<FindNfsByRpsOutputDto> {
    const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(nfse.props.companyId);
    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;

    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    return this.nfsGenerationGateway.findNfseByRps({
      nfseId: nfse.props.id,
      rpsNumber: nfse.props.rpsNumber,
      rpsSeries: nfse.props.rpsSeries,
      providerDocument: snapshot.providerDocument,
      providerMunicipalRegistration: providerConfig.municipalRegistration,
      provider,
    });
  }

  /**
   * A nota existe do lado do provedor. `issueDate` vem dele, nunca de `now()`: é a partir dela que
   * corre o prazo de cancelamento, e uma nota descoberta hoje pode ter sido emitida semanas atrás.
   */
  private async applyIssued(
    nfse: Nfse,
    previousStatus: NfseStatus,
    note: NfsIssuedNoteDto,
  ): Promise<ReconcileNfseOutputDto> {
    nfse.markIssued(note.nfseNumber, note.verificationCode, new Date(note.issueDate));
    nfse.scheduleNextReconcile(null);
    await this.nfseRepository.edit(nfse);
    await this.queueProducer.addIssueBankPaymentJob({ nfseId: nfse.props.id });

    this.logger.debug(LogContext.NFS_GENERATION, {
      adapter: 'nfse',
      action: 'reconcileNfse',
      nfseId: nfse.props.id,
      nfseNumber: note.nfseNumber,
      rpsNumber: nfse.props.rpsNumber,
    });

    return {
      nfseId: nfse.props.id,
      previousStatus,
      newStatus: nfse.props.status,
      source: ReconcileNfseSource.ProviderIssued,
      nfseNumber: note.nfseNumber,
    };
  }

  /**
   * A consulta falhou por motivo próprio. A nota fica onde ninguém pode afirmar nada — não
   * terminal — e volta a ser consultada. `errorMessage` guarda o que o provedor disse, para que o
   * alerta e a rota de reemissão consigam explicar por que ainda não dá para decidir.
   */
  private async applyQueryFailed(
    nfse: Nfse,
    previousStatus: NfseStatus,
    message: string,
  ): Promise<ReconcileNfseOutputDto> {
    nfse.scheduleNextReconcile(this.nextReconcileAt(nfse));
    nfse.markAwaitingProvider(message);
    await this.nfseRepository.edit(nfse);

    return {
      nfseId: nfse.props.id,
      previousStatus,
      newStatus: nfse.props.status,
      source: ReconcileNfseSource.ProviderQueryFailed,
      message,
    };
  }

  /**
   * O provedor não conhece este RPS. Com protocolo, o lote foi aceito e a consulta do lote é a
   * fonte melhor — reenviar aqui criaria uma segunda nota se o lote ainda estiver em processamento.
   * Sem protocolo, nada chegou lá: reenviar o **mesmo** RPS é seguro e é o que destrava a nota.
   *
   * `REJECTED`/`FAILED` já encerraram o lote. E212 aí não é processamento em voo: inventar
   * `AWAITING_PROVIDER` trava a reemissão autorizada (P1-04). Reconcile não inventa estado; reenvio
   * é a rota de reissue.
   */
  private async applyNotFound(nfse: Nfse, previousStatus: NfseStatus): Promise<ReconcileNfseOutputDto> {
    if (nfse.isRejected() || nfse.isFailed()) {
      return {
        nfseId: nfse.props.id,
        previousStatus,
        newStatus: nfse.props.status,
        source: ReconcileNfseSource.ProviderNotFound,
        message: 'Giss confirmou que não conhece este RPS',
      };
    }

    const hasProtocol = !!nfse.props.batchProtocol;
    const message = hasProtocol
      ? 'Giss ainda não conhece este RPS; lote aceito, consulta do lote reagendada'
      : 'Giss confirmou que não recebeu este RPS; reenvio do mesmo RPS reagendado';

    nfse.scheduleNextReconcile(this.nextReconcileAt(nfse));

    if (hasProtocol) {
      nfse.markAwaitingProvider(message);
      await this.nfseRepository.edit(nfse);
      await this.queueProducer.addPollBatchJob({ nfseId: nfse.props.id, attempt: 1 });
    }
    else {
      nfse.resetForReissue();
      await this.nfseRepository.edit(nfse);
      await this.queueProducer.addIssueBatchJob({ nfseId: nfse.props.id });
    }

    return {
      nfseId: nfse.props.id,
      previousStatus,
      newStatus: nfse.props.status,
      source: hasProtocol ? ReconcileNfseSource.ProviderNotFoundPolling : ReconcileNfseSource.ProviderNotFoundRequeued,
      message,
    };
  }

  private async noOp(nfse: Nfse, previousStatus: NfseStatus): Promise<ReconcileNfseOutputDto> {
    if (nfse.props.nextReconcileAt !== null) {
      nfse.scheduleNextReconcile(null);
      await this.nfseRepository.edit(nfse);
    }

    return {
      nfseId: nfse.props.id,
      previousStatus,
      newStatus: nfse.props.status,
      source: ReconcileNfseSource.NoOp,
    };
  }

  /** `null` quando a janela de decisão humana se abre: a partir daí insistir não ajuda. */
  private nextReconcileAt(nfse: Nfse): Date | null {
    const ageInDays = (Date.now() - nfse.props.createdAt.getTime()) / ONE_DAY_IN_MS;
    if (ageInDays >= RECONCILE_DEADLINE_IN_DAYS) {
      return null;
    }

    const delayMs = RECONCILE_DELAYS_MS[nfse.props.reconcileAttemptCount] ?? ONE_DAY_IN_MS;
    return new Date(Date.now() + delayMs);
  }
}
