import { Inject, Injectable } from '@nestjs/common';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { IssueNfsBatchOutputDto } from 'src/infra/nfs-generation/dtos/issue-nfs-batch.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { NfsRpsType } from 'src/infra/nfs-generation/dtos/nfs-rps.dto';
import { NfsBatchRejectedError } from 'src/infra/nfs-generation/errors/nfs-batch-rejected.error';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
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
    private readonly recordJobAudit: RecordJobAudit,
  ) {}

  public async execute(input: ProcessIssueNfseBatchInputDto): Promise<void> {
    const nfse = await this.nfseRepository.findById(input.nfseId);
    if (!nfse) {
      throw new NfseNotFoundError();
    }
    // A guarda é `canSubmitToProvider()`, não `isIssued()`: um job reentregue pelo BullMQ (worker
    // morto entre o `issueBatch` e o `edit`, job "stalled") encontraria a nota em `SUBMITTED` ou
    // `AWAITING_PROVIDER` e reenviaria o mesmo RPS — reenvio cego, que é o caminho para uma segunda
    // NFS-e. Só o provedor pode afirmar que a nota não existe, e essa consulta ainda não existe.
    if (!nfse.canSubmitToProvider()) {
      this.logger.debug(LogContext.NFS_GENERATION, {
        adapter: 'nfse',
        action: 'processIssueNfseBatch',
        nfseId: nfse.props.id,
        errorMessage: `Envio ignorado: NFS-e em ${nfse.props.status} não pode ser reenviada por este caminho`,
      });
      return;
    }

    const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(nfse.props.companyId);

    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: SAO_PAULO_TIMEZONE });

    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    let result: IssueNfsBatchOutputDto;
    try {
      result = await this.nfsGenerationGateway.issueBatch({
        nfseId: nfse.props.id,
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
        nfseId: nfse.props.id,
        error,
      });

      const message = error?.message ?? 'Erro desconhecido ao enviar lote ao provedor de NFS-e';
      const previousStatus = nfse.props.status;

      if (error instanceof NfsBatchRejectedError && !error.alreadySubmitted) {
        // O fisco recusou o conteúdo do RPS. Reemitir depois de corrigir o cadastro é a saída, e a
        // rota de reemissão exige `REJECTED` — misturar isto com `FAILED` apagaria a distinção.
        nfse.markRejected(message);
      }
      else if (ProcessIssueNfseBatch.isPermanentFailure(error)) {
        nfse.markFailed(message);
      }
      else {
        nfse.markAwaitingProvider(message);
      }

      await this.nfseRepository.edit(nfse);
      this.recordJobAudit.record({
        jobName: 'issue-nfse-batch',
        nfseId: nfse.props.id,
        from: previousStatus,
        to: nfse.props.status,
        reason: message,
        succeeded: false,
      });
      return;
    }

    const previousStatus = nfse.props.status;
    nfse.markSubmitted(result.batchProtocol);
    await this.nfseRepository.edit(nfse);
    this.recordJobAudit.record({
      jobName: 'issue-nfse-batch',
      nfseId: nfse.props.id,
      from: previousStatus,
      to: nfse.props.status,
      reason: `Protocolo ${result.batchProtocol}`,
    });

    await this.queueProducer.addPollBatchJob(
      { nfseId: nfse.props.id, attempt: 1 },
      { delayMs: ProcessIssueNfseBatch.FIRST_POLL_DELAY_MS },
    );
  }

  /**
   * Só marca estado terminal o que se sabe que não gerou nota. Erro de configuração é
   * determinístico e nunca chegou ao provedor; rejeição de negócio (`NfsBatchRejectedError` sem
   * `alreadySubmitted`) também — essa vira `REJECTED`, tratada antes. Todo o resto — timeout, TLS,
   * 5xx, conexão cortada, ou "RPS já informado" — é ambíguo, e afirmar falha num caso ambíguo é o
   * único erro irreversível deste fluxo: a operação para de procurar por uma nota que pode existir.
   */
  private static isPermanentFailure(error: unknown): boolean {
    if (error instanceof NfsProviderConfigError) {
      return true;
    }

    if (error instanceof NfsBatchRejectedError) {
      return !error.alreadySubmitted;
    }

    return false;
  }
}
