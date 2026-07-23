import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { IssueNfsBatchOutputDto } from 'src/infra/nfs-generation/dtos/issue-nfs-batch.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { NfsRpsType } from 'src/infra/nfs-generation/dtos/nfs-rps.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { Nfse } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfsProviderNotConfiguredError } from '../../../domain/errors/nfs-provider-not-configured.error';
import type { INfsProviderConfigDao } from '../../persistence/dao/nfs-provider-config-dao.interface';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBatchInputDto } from './dtos/process-issue-nfse-batch.dto';

@Injectable()
export class ProcessIssueNfseBatch {
  private static readonly FIRST_POLL_DELAY_MS = 30_000;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.NfsProviderConfigDao) private readonly providerConfigDao: INfsProviderConfigDao,
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
  ) {}

  public async execute(input: ProcessIssueNfseBatchInputDto): Promise<void> {
    const nfseDto = await this.nfseDao.findById(input.nfseId);
    if (!nfseDto) {
      throw new NfseNotFoundError();
    }
    if (nfseDto.status === NfseStatus.ISSUED) {
      return;
    }

    const nfse = Nfse._instantiate(nfseDto);

    const providerConfig = await this.providerConfigDao.findByCompanyId(nfseDto.companyId);
    if (!providerConfig) {
      throw new NfsProviderNotConfiguredError();
    }

    const snapshot = nfseDto.data as unknown as NfseIssueSnapshot;
    const today = new Date().toISOString().slice(0, 10);

    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    let result: IssueNfsBatchOutputDto;
    try {
      result = await this.nfsGenerationGateway.issueBatch({
        batchNumber: nfseDto.rpsNumber,
        provider,
        rpsList: [
          {
            rpsNumber: nfseDto.rpsNumber,
            rpsSeries: nfseDto.rpsSeries,
            rpsType: NfsRpsType.Rps,
            issueDate: today,
            competence: today,
            provider: {
              document: snapshot.providerDocument,
              municipalRegistration: snapshot.providerMunicipalRegistration,
            },
            taker: {
              identification: { document: snapshot.clientDocument },
              companyName: snapshot.clientCompanyName,
            },
            service: {
              serviceListItemCode: snapshot.input.service.serviceListItemCode,
              nbsCode: snapshot.input.service.nbsCode,
              description: snapshot.input.service.description,
              serviceMunicipalCodeIbge: snapshot.input.service.serviceMunicipalCodeIbge,
              issExigibility: snapshot.input.service.issExigibility,
              issWithheld: snapshot.input.service.issWithheld,
              servicesValue: snapshot.input.service.servicesValue,
              cnaeCode: snapshot.input.service.cnaeCode,
              municipalTaxCode: snapshot.input.service.municipalTaxCode,
              issValue: snapshot.input.service.issValue,
              issRate: snapshot.input.service.issRate,
            },
            simpleNationalOptant: snapshot.input.simpleNationalOptant,
            fiscalIncentive: snapshot.input.fiscalIncentive,
            additionalInformation: snapshot.input.additionalInformation,
          },
        ],
      });
    }
    catch (error: any) {
      this.logger.error(LogContext.NFS_GENERATION, {
        adapter: 'nfse',
        action: 'processIssueNfseBatch',
        error,
      });

      nfse.markFailed(error?.message ?? 'Erro desconhecido ao enviar lote ao provedor de NFS-e');
      await this.nfseDao.updateStatus(nfse.props.id, {
        status: nfse.props.status,
        errorMessage: nfse.props.errorMessage ?? undefined,
      });
      return;
    }

    nfse.markSubmitted(result.batchProtocol);
    await this.nfseDao.updateStatus(nfse.props.id, {
      status: nfse.props.status,
      batchProtocol: nfse.props.batchProtocol ?? undefined,
    });

    await this.queueProducer.addPollBatchJob(
      { nfseId: nfse.props.id, attempt: 1 },
      { delayMs: ProcessIssueNfseBatch.FIRST_POLL_DELAY_MS },
    );
  }
}
