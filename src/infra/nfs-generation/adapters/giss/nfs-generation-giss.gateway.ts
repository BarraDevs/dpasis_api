import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { NfsBatchRejectedError } from 'src/infra/nfs-generation/errors/nfs-batch-rejected.error';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
import { TOKENS } from 'src/core/di/token';
import { ProviderAttemptOperation } from 'src/infra/provider-attempt/enums/provider-attempt-operation.enum';
import type { IProviderAttemptRecorder } from 'src/infra/provider-attempt/provider-attempt.gateway';
import { CancelNfsInputDto, CancelNfsOutputDto } from '../../dtos/cancel-nfs.dto';
import { GetNfsBatchStatusInputDto, NfsBatchStatusDto } from '../../dtos/nfs-batch-status.dto';
import { IssueNfsBatchInputDto, IssueNfsBatchOutputDto } from '../../dtos/issue-nfs-batch.dto';
import { NfsProviderCredentialsDto } from '../../dtos/nfs-provider-credentials.dto';
import { INfsGenerationGateway } from '../../nfs-generation.gateway';
import { GissBatchStatusMapper } from './mappers/giss-batch-status.mapper';
import { GissCancelNfseMapper } from './mappers/giss-cancel-nfse.mapper';
import { GissIssueBatchMapper } from './mappers/giss-issue-batch.mapper';
import { GissPfxLoader } from './signing/giss-pfx-loader';
import { GissXmlSigner } from './signing/giss-xml-signer';
import { GissSoapCallError, type GissSoapCallTrace } from './soap/giss-soap-call.error';
import { GissOperation, GissSoapClient } from './soap/giss-soap-client';

@Injectable()
export class NfsGenerationGissAdapterGateway implements INfsGenerationGateway {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.ProviderAttemptRecorder) private readonly attemptRecorder: IProviderAttemptRecorder,
    private readonly httpService: HttpService,
  ) {}

  public async issueBatch(input: IssueNfsBatchInputDto): Promise<IssueNfsBatchOutputDto> {
    const municipioSlug = this.getMunicipioSlug(input.provider);
    const certMaterial = GissPfxLoader.load(input.provider.certFilePath, input.provider.certPasswordEnvVar);

    try {
      const { xml, loteId, rpsIds } = GissIssueBatchMapper.buildIssueBatchXml(input);
      const rpsSignedXml = rpsIds.reduce((currentXml, rpsId) => GissXmlSigner.signElementById(currentXml, rpsId, certMaterial), xml);
      const signedXml = GissXmlSigner.signElementById(rpsSignedXml, loteId, certMaterial);

      const call = await GissSoapClient.postSoapRequest(
        this.httpService,
        municipioSlug,
        GissOperation.RecepcionarLoteRps,
        signedXml,
        certMaterial,
      );
      await this.recordAttempt(ProviderAttemptOperation.GissRecepcionarLote, input.nfseId, call);

      return GissIssueBatchMapper.parseRecepcionarLoteRpsResponse(call.outputXml);
    }
    catch (error: any) {
      await this.recordFailedAttempt(ProviderAttemptOperation.GissRecepcionarLote, input.nfseId, error);
      error = GissSoapCallError.unwrap(error);
      if (error instanceof NfsProviderConfigError || error instanceof NfsBatchRejectedError) {
        throw error;
      }
      this.logger.error(LogContext.NFS_GENERATION, {
        adapter: 'giss',
        action: 'issueBatch',
        batchNumber: input.batchNumber,
        error,
        errorMessage: error?.message,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao enviar lote de RPS ao Giss');
    }
  }

  public async getBatchStatus(input: GetNfsBatchStatusInputDto): Promise<NfsBatchStatusDto> {
    const municipioSlug = this.getMunicipioSlug(input.provider);
    const certMaterial = GissPfxLoader.load(input.provider.certFilePath, input.provider.certPasswordEnvVar);

    try {
      const xml = GissBatchStatusMapper.buildConsultarLoteRpsXml(input);
      // ConsultarLoteRpsEnvio não tem atributo Id no XSD (diferente de tcLoteRps), então a assinatura só
      // pode ser sobre o documento inteiro (URI="" / enveloped) — ver GissXmlSigner.signWholeDocument.
      const signedXml = GissXmlSigner.signWholeDocument(xml, certMaterial);

      const call = await GissSoapClient.postSoapRequest(
        this.httpService,
        municipioSlug,
        GissOperation.ConsultarLoteRps,
        signedXml,
        certMaterial,
      );
      await this.recordAttempt(ProviderAttemptOperation.GissConsultarLote, input.nfseId, call);

      return GissBatchStatusMapper.parseConsultarLoteRpsResponse(call.outputXml);
    }
    catch (error: any) {
      await this.recordFailedAttempt(ProviderAttemptOperation.GissConsultarLote, input.nfseId, error);
      error = GissSoapCallError.unwrap(error);
      if (error instanceof NfsProviderConfigError) {
        throw error;
      }
      this.logger.error(LogContext.NFS_GENERATION, {
        adapter: 'giss',
        action: 'getBatchStatus',
        batchProtocol: input.batchProtocol,
        error,
        errorMessage: error?.message,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao consultar status do lote no Giss');
    }
  }

  public async cancelNfse(input: CancelNfsInputDto): Promise<CancelNfsOutputDto> {
    const municipioSlug = this.getMunicipioSlug(input.provider);
    const certMaterial = GissPfxLoader.load(input.provider.certFilePath, input.provider.certPasswordEnvVar);

    try {
      const { xml, infId } = GissCancelNfseMapper.buildCancelarNfseXml(input);
      const signedXml = GissXmlSigner.signElementById(xml, infId, certMaterial);

      const call = await GissSoapClient.postSoapRequest(
        this.httpService,
        municipioSlug,
        GissOperation.CancelarNfse,
        signedXml,
        certMaterial,
      );
      await this.recordAttempt(ProviderAttemptOperation.GissCancelar, input.nfseId, call);

      return GissCancelNfseMapper.parseCancelarNfseResponse(call.outputXml);
    }
    catch (error: any) {
      await this.recordFailedAttempt(ProviderAttemptOperation.GissCancelar, input.nfseId, error);
      error = GissSoapCallError.unwrap(error);
      if (error instanceof NfsProviderConfigError) {
        throw error;
      }
      this.logger.error(LogContext.NFS_GENERATION, {
        adapter: 'giss',
        action: 'cancelNfse',
        nfseNumber: input.nfseNumber,
        error,
        errorMessage: error?.message,
      });
      throw new ExternalApiError(error?.message ?? 'Erro ao cancelar NFS-e no Giss');
    }
  }

  private async recordAttempt(operation: ProviderAttemptOperation, nfseId: number | undefined, call: GissSoapCallTrace, errorClass?: string): Promise<void> {
    // `nfseId` é opcional na entrada porque nem todo chamador do gateway tem uma NFS-e local — mas sem
    // ele não há onde ancorar a linha, então a tentativa simplesmente não é gravada.
    if (!nfseId) {
      return;
    }

    await this.attemptRecorder.record({
      nfseId,
      operation,
      requestBody: call.requestBody,
      responseBody: call.responseBody,
      httpStatus: call.httpStatus,
      durationMs: call.durationMs,
      errorClass: errorClass ?? null,
    });
  }

  private async recordFailedAttempt(operation: ProviderAttemptOperation, nfseId: number | undefined, error: unknown): Promise<void> {
    if (!(error instanceof GissSoapCallError)) {
      // Falhou antes de a requisição sair (config, assinatura, PFX): não há corpo para registrar, e
      // o log já cobre o caso.
      return;
    }

    const cause = GissSoapCallError.unwrap(error);
    await this.recordAttempt(
      operation,
      nfseId,
      error.trace,
      cause instanceof Error ? cause.name : 'UnknownError',
    );
  }

  private getMunicipioSlug(provider: NfsProviderCredentialsDto): string {
    const slug = provider.vendorConfig?.municipioSlug;
    if (typeof slug !== 'string' || !slug) {
      throw new NfsProviderConfigError('Configuração do prestador não define "municipioSlug" (vendorConfig) para o Giss');
    }
    return slug;
  }
}
