import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfsBatchSituation, NfsBatchStatusDto } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { Nfse } from '../../../domain/entities/nfse.entity';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessPollNfseBatchInputDto } from './dtos/process-poll-nfse-batch.dto';

@Injectable()
export class ProcessPollNfseBatch {
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly POLL_DELAY_MS = 30_000;

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
        batchProtocol: nfse.props.batchProtocol!, // canPoll() ensures batchProtocol is not null
        providerDocument: snapshot.providerDocument,
        provider,
      });
    }
    catch (error: any) {
      this.logger.error(LogContext.NFS_GENERATION, {
        adapter: 'nfse',
        action: 'processPollNfseBatch',
        batchProtocol: nfse.props.batchProtocol!, // canPoll() ensures batchProtocol is not null
        error,
      });
      await this.rescheduleOrFail(nfse, input.attempt, 'Erro ao consultar status do lote no Giss');
      return;
    }

    if (status.situation === NfsBatchSituation.Success) {
      const issuedNote = status.issuedNotes?.[0];
      if (!issuedNote) {
        nfse.markFailed('Giss retornou sucesso na consulta do lote, mas sem dados da NFS-e emitida');
        await this.nfseRepository.edit(nfse);
        return;
      }

      nfse.markIssued(issuedNote.nfseNumber, issuedNote.verificationCode, new Date(issuedNote.issueDate));
      await this.nfseRepository.edit(nfse);
      return;
    }

    if (status.situation === NfsBatchSituation.Error) {
      const message = status.errors?.map(e => `${e.code}: ${e.message}`).join('; ') ?? 'Lote rejeitado pelo Giss';
      nfse.markFailed(message);
      await this.nfseRepository.edit(nfse);
      return;
    }

    // NOT_RECEIVED ou PENDING: reagenda a consulta
    await this.rescheduleOrFail(nfse, input.attempt, `Excedeu ${ProcessPollNfseBatch.MAX_ATTEMPTS} tentativas de consulta de status sem retorno definitivo do Giss`);
  }

  private async rescheduleOrFail(nfse: Nfse, attempt: number, failureMessage: string): Promise<void> {
    if (attempt >= ProcessPollNfseBatch.MAX_ATTEMPTS) {
      nfse.markFailed(failureMessage);
      await this.nfseRepository.edit(nfse);
      return;
    }

    nfse.markProcessing();
    await this.nfseRepository.edit(nfse);
    await this.queueProducer.addPollBatchJob(
      { nfseId: nfse.props.id, attempt: attempt + 1 },
      { delayMs: ProcessPollNfseBatch.POLL_DELAY_MS },
    );
  }
}
