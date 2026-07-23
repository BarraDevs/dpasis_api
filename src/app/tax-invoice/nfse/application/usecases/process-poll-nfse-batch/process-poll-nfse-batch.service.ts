import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfsBatchSituation, NfsBatchStatusDto } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { Nfse } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfsProviderNotConfiguredError } from '../../../domain/errors/nfs-provider-not-configured.error';
import type { INfsProviderConfigDao } from '../../persistence/dao/nfs-provider-config-dao.interface';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessPollNfseBatchInputDto } from './dtos/process-poll-nfse-batch.dto';

@Injectable()
export class ProcessPollNfseBatch {
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly POLL_DELAY_MS = 30_000;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.NfsProviderConfigDao) private readonly providerConfigDao: INfsProviderConfigDao,
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
  ) {}

  public async execute(input: ProcessPollNfseBatchInputDto): Promise<void> {
    const nfseDto = await this.nfseDao.findById(input.nfseId);
    if (!nfseDto) {
      throw new NfseNotFoundError();
    }
    if (nfseDto.status === NfseStatus.ISSUED || nfseDto.status === NfseStatus.FAILED) {
      return;
    }
    if (!nfseDto.batchProtocol) {
      return;
    }

    const nfse = Nfse._instantiate(nfseDto);

    const providerConfig = await this.providerConfigDao.findByCompanyId(nfseDto.companyId);
    if (!providerConfig) {
      throw new NfsProviderNotConfiguredError();
    }

    const snapshot = nfseDto.data as unknown as NfseIssueSnapshot;
    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    let status: NfsBatchStatusDto;
    try {
      status = await this.nfsGenerationGateway.getBatchStatus({
        batchProtocol: nfseDto.batchProtocol,
        providerDocument: snapshot.providerDocument,
        provider,
      });
    }
    catch (error: any) {
      this.logger.error(LogContext.NFS_GENERATION, {
        adapter: 'nfse',
        action: 'processPollNfseBatch',
        batchProtocol: nfseDto.batchProtocol,
        error,
      });
      await this.rescheduleOrFail(nfse, input.attempt, 'Erro ao consultar status do lote no Giss');
      return;
    }

    if (status.situation === NfsBatchSituation.Success) {
      const issuedNote = status.issuedNotes?.[0];
      if (!issuedNote) {
        nfse.markFailed('Giss retornou sucesso na consulta do lote, mas sem dados da NFS-e emitida');
        await this.nfseDao.updateStatus(nfse.props.id, { status: nfse.props.status, errorMessage: nfse.props.errorMessage ?? undefined });
        return;
      }

      nfse.markIssued(issuedNote.nfseNumber, issuedNote.verificationCode, new Date(issuedNote.issueDate));
      await this.nfseDao.updateStatus(nfse.props.id, {
        status: nfse.props.status,
        nfseNumber: nfse.props.nfseNumber ?? undefined,
        verificationCode: nfse.props.verificationCode ?? undefined,
        issuedAt: nfse.props.issuedAt ?? undefined,
      });
      return;
    }

    if (status.situation === NfsBatchSituation.Error) {
      const message = status.errors?.map(e => `${e.code}: ${e.message}`).join('; ') ?? 'Lote rejeitado pelo Giss';
      nfse.markFailed(message);
      await this.nfseDao.updateStatus(nfse.props.id, { status: nfse.props.status, errorMessage: nfse.props.errorMessage ?? undefined });
      return;
    }

    // NOT_RECEIVED ou PENDING: reagenda a consulta
    await this.rescheduleOrFail(nfse, input.attempt, `Excedeu ${ProcessPollNfseBatch.MAX_ATTEMPTS} tentativas de consulta de status sem retorno definitivo do Giss`);
  }

  private async rescheduleOrFail(nfse: Nfse, attempt: number, failureMessage: string): Promise<void> {
    if (attempt >= ProcessPollNfseBatch.MAX_ATTEMPTS) {
      nfse.markFailed(failureMessage);
      await this.nfseDao.updateStatus(nfse.props.id, { status: nfse.props.status, errorMessage: nfse.props.errorMessage ?? undefined });
      return;
    }

    nfse.markProcessing();
    await this.nfseDao.updateStatus(nfse.props.id, { status: nfse.props.status });
    await this.queueProducer.addPollBatchJob(
      { nfseId: nfse.props.id, attempt: attempt + 1 },
      { delayMs: ProcessPollNfseBatch.POLL_DELAY_MS },
    );
  }
}
