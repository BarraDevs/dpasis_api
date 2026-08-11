import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { IssueNfsBatchOutputDto } from 'src/infra/nfs-generation/dtos/issue-nfs-batch.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { NfsRpsType } from 'src/infra/nfs-generation/dtos/nfs-rps.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBatchInputDto } from './dtos/process-issue-nfse-batch.dto';

@Injectable()
export class ProcessIssueNfseBatch {
  private static readonly FIRST_POLL_DELAY_MS = 30_000;

  constructor(
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
  ) {}

  public async execute(input: ProcessIssueNfseBatchInputDto): Promise<void> {
    const nfse = await this.nfseRepository.findById(input.nfseId);
    if (!nfse) {
      throw new NfseNotFoundError();
    }
    if (nfse.isIssued()) {
      return;
    }

    const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(nfse.props.companyId);

    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;
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
        batchNumber: nfse.props.rpsNumber,
        provider,
        rpsList: [
          {
            rpsNumber: nfse.props.rpsNumber,
            rpsSeries: nfse.props.rpsSeries,
            rpsType: NfsRpsType.Rps,
            issueDate: today,
            competence: today,
            provider: {
              document: snapshot.providerDocument,
              municipalRegistration: snapshot.providerMunicipalRegistration,
            },
            taker: {
              companyName: snapshot.clientCompanyName,
              identification: {
                document: snapshot.clientDocument,
              },
              address: snapshot.takerAddress ? {
                street: snapshot.takerAddress.street,
                number: snapshot.takerAddress.number,
                complement: snapshot.takerAddress.complement ?? undefined,
                neighborhood: snapshot.takerAddress.neighborhood,
                cityCodeIbge: snapshot.takerAddress.cityCodeIbge,
                state: snapshot.takerAddress.state,
                zipCode: snapshot.takerAddress.zipCode.replace(/\D/g, ''),
              } : undefined,
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
              issRetentionResponsible: snapshot.input.service.issRetentionResponsible,
              ibsCbs: {
                indopCode: snapshot.input.service.indopCode,
                cst: snapshot.input.service.ibsCbsCst ?? '000',
                cClassTrib: snapshot.input.service.cClassTrib ?? '000001',
              },
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
      await this.nfseRepository.edit(nfse);
      return;
    }

    nfse.markSubmitted(result.batchProtocol);
    await this.nfseRepository.edit(nfse);

    await this.queueProducer.addPollBatchJob(
      { nfseId: nfse.props.id, attempt: 1 },
      { delayMs: ProcessIssueNfseBatch.FIRST_POLL_DELAY_MS },
    );
  }
}
