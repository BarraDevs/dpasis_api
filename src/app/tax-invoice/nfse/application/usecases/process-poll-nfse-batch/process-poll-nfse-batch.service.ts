import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import {
  NfsBatchErrorKind,
  NfsBatchSituation,
  NfsBatchStatusDto,
  NfsIssuedNoteDto,
} from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { Nfse } from '../../../domain/entities/nfse.entity';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessPollNfseBatchInputDto } from './dtos/process-poll-nfse-batch.dto';

@Injectable()
export class ProcessPollNfseBatch {
  /**
   * Escalonado em vez de 30s fixo: a janela total passa de ~5 minutos para ~1,5 dia. Cinco minutos
   * cobrem uma prefeitura lenta, não uma manutenção — e a nota que sobrevive à indisponibilidade é
   * a diferença entre reconciliar depois e descobrir a divergência pelo cliente.
   */
  private static readonly POLL_DELAYS_MS = [
    30_000, // 30s
    60_000, // 1min
    300_000, // 5min
    900_000, // 15min
    3_600_000, // 1h
    21_600_000, // 6h
    86_400_000, // 24h
  ];

  /**
   * O ladder agenda uma consulta a mais do que tem degraus: a primeira é agendada pelo envio do
   * lote (`ProcessIssueNfseBatch.FIRST_POLL_DELAY_MS`) e cada degrau agenda a seguinte. Contar só
   * os degraus subnotificaria a tentativa que de fato esgotou a janela.
   */
  private static readonly MAX_POLL_ATTEMPTS = ProcessPollNfseBatch.POLL_DELAYS_MS.length + 1;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
  ) {}

  public async execute(input: ProcessPollNfseBatchInputDto): Promise<void> {
    const nfse = await this.nfseRepository.findById(input.nfseId);
    if (!nfse) {
      throw new NfseNotFoundError();
    }
    if (!nfse.canPoll()) {
      return;
    }

    const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(nfse.props.companyId);

    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;
    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    let status: NfsBatchStatusDto;
    try {
      status = await this.nfsGenerationGateway.getBatchStatus({
        nfseId: nfse.props.id,
        batchProtocol: nfse.props.batchProtocol!, // canPoll() ensures batchProtocol is not null
        providerDocument: snapshot.providerDocument,
        provider,
      });
    }
    catch (error: any) {
      this.logger.error(LogContext.NFS_GENERATION, {
        adapter: 'nfse',
        action: 'processPollNfseBatch',
        nfseId: nfse.props.id,
        batchProtocol: nfse.props.batchProtocol!, // canPoll() ensures batchProtocol is not null
        error,
      });
      const message = `Erro ao consultar status do lote no Giss: ${error?.message ?? 'sem detalhes'}`;

      // Configuração quebrada é determinística: gastar degraus do ladder atrasa a próxima consulta
      // de verdade em horas sem nenhuma chance de o resultado mudar.
      if (error instanceof NfsProviderConfigError) {
        nfse.markAwaitingProvider(message);
        await this.nfseRepository.edit(nfse);
        return;
      }

      await this.rescheduleOrFail(nfse, input.attempt, message);
      return;
    }

    if (status.situation === NfsBatchSituation.Success) {
      const issuedNotes = status.issuedNotes ?? [];
      if (issuedNotes.length === 0) {
        // O lote foi processado com sucesso, então a nota existe do outro lado — o que falta são os
        // dados dela. `FAILED` aqui afirmaria o contrário do que o provedor acabou de responder.
        nfse.markAwaitingProvider('Giss retornou sucesso na consulta do lote, mas sem dados da NFS-e emitida');
        await this.nfseRepository.edit(nfse);
        return;
      }

      const issuedNote = ProcessPollNfseBatch.matchIssuedNote(issuedNotes, nfse);
      if (!issuedNote) {
        // Gravar o número de outra nota é irreversível e silencioso: a NFS-e passaria a apontar
        // para um documento que não é dela. Melhor parar num estado não terminal e escalar.
        nfse.markAwaitingProvider(
          `Giss devolveu ${issuedNotes.length} nota(s) e nenhuma corresponde ao RPS `
          + `${nfse.props.rpsNumber}/${nfse.props.rpsSeries}`,
        );
        await this.nfseRepository.edit(nfse);
        return;
      }

      nfse.markIssued(issuedNote.nfseNumber, issuedNote.verificationCode, new Date(issuedNote.issueDate));
      await this.nfseRepository.edit(nfse);
      await this.queueProducer.addIssueBankPaymentJob({ nfseId: nfse.props.id });
      return;
    }

    if (status.situation === NfsBatchSituation.Error) {
      const message = status.errors?.map(e => `${e.code}: ${e.message}`).join('; ') ?? 'Lote rejeitado pelo provedor de NFS-e';
      const alreadySubmitted = status.errors?.some(e => e.kind === NfsBatchErrorKind.AlreadySubmitted);

      if (alreadySubmitted) {
        nfse.markAwaitingProvider(message);
      }
      else {
        nfse.markFailed(message);
      }

      await this.nfseRepository.edit(nfse);
      return;
    }

    // NOT_RECEIVED ou PENDING: reagenda a consulta
    await this.rescheduleOrFail(
      nfse,
      input.attempt,
      `Excedeu ${ProcessPollNfseBatch.MAX_POLL_ATTEMPTS} tentativas de consulta de status sem retorno definitivo do Giss`,
    );
  }

  /**
   * Casa a nota devolvida pela prefeitura com a NFS-e local pela chave natural do RPS. Pegar
   * `issuedNotes[0]` só funcionava porque o lote sempre teve um RPS — com mais de um, grava o
   * número errado, em silêncio e sem volta.
   *
   * A tolerância do fallback existe porque a identificação do RPS é opcional no XSD e o parser
   * devolve `0`/`''` quando ela não vem: num lote de uma nota só, a correspondência é inequívoca
   * mesmo sem o identificador. Com mais de uma, não é, e aí ninguém é escolhido.
   */
  private static matchIssuedNote(issuedNotes: NfsIssuedNoteDto[], nfse: Nfse): NfsIssuedNoteDto | null {
    const normalizeSeries = (series: string) => series.trim().toUpperCase();
    const expectedSeries = normalizeSeries(nfse.props.rpsSeries);

    const matched = issuedNotes.find((note) => (
      Number(note.rpsNumber) === nfse.props.rpsNumber
      && normalizeSeries(note.rpsSeries) === expectedSeries
    ));
    if (matched) {
      return matched;
    }

    const [onlyNote] = issuedNotes;
    const hasNoRpsIdentification = issuedNotes.length === 1 && !onlyNote.rpsNumber && !onlyNote.rpsSeries.trim();
    return hasNoRpsIdentification ? onlyNote : null;
  }

  /**
   * Ao esgotar o ladder a nota vai para `AWAITING_PROVIDER`, nunca `FAILED`: existe protocolo, o
   * lote foi aceito, e só uma consulta ao provedor pode afirmar que a nota não foi emitida — o que
   * o fluxo ainda não sabe fazer. Rejeição de negócio (situação 3) é tratada antes de chegar aqui.
   */
  private async rescheduleOrFail(nfse: Nfse, attempt: number, failureMessage: string): Promise<void> {
    const delayMs = ProcessPollNfseBatch.POLL_DELAYS_MS[attempt - 1];

    if (delayMs === undefined) {
      nfse.markAwaitingProvider(failureMessage);
      await this.nfseRepository.edit(nfse);
      return;
    }

    nfse.markProcessing();
    await this.nfseRepository.edit(nfse);
    await this.queueProducer.addPollBatchJob(
      { nfseId: nfse.props.id, attempt: attempt + 1 },
      { delayMs },
    );
  }
}
