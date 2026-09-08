import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { TransientProviderError } from 'src/shared/errors/transient-provider.error';
import { NfsBatchRejectedError } from 'src/infra/nfs-generation/errors/nfs-batch-rejected.error';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
import { TOKENS } from 'src/core/di/token';
import { ProviderAttemptOperation } from 'src/infra/provider-attempt/enums/provider-attempt-operation.enum';
import type { IProviderAttemptRecorder } from 'src/infra/provider-attempt/provider-attempt.gateway';
import { CancelNfsInputDto, CancelNfsOutputDto } from '../../dtos/cancel-nfs.dto';
import { FindNfsByRpsInputDto, FindNfsByRpsOutputDto } from '../../dtos/find-nfs-by-rps.dto';
import { ListIssuedNfsInputDto, ListIssuedNfsOutputDto } from '../../dtos/list-issued-nfs.dto';
import { GetNfsBatchStatusInputDto, NfsBatchStatusDto } from '../../dtos/nfs-batch-status.dto';
import { IssueNfsBatchInputDto, IssueNfsBatchOutputDto } from '../../dtos/issue-nfs-batch.dto';
import { NfsProviderCredentialsDto } from '../../dtos/nfs-provider-credentials.dto';
import { INfsGenerationGateway } from '../../nfs-generation.gateway';
import { GissBatchStatusMapper } from './mappers/giss-batch-status.mapper';
import { GissCancelNfseMapper } from './mappers/giss-cancel-nfse.mapper';
import { GissConsultarNfseRpsMapper } from './mappers/giss-consultar-nfse-rps.mapper';
import { GissConsultarServicoPrestadoMapper } from './mappers/giss-consultar-servico-prestado.mapper';
import { GissIssueBatchMapper } from './mappers/giss-issue-batch.mapper';
import { GissPfxLoader } from './signing/giss-pfx-loader';
import { GissXmlSigner } from './signing/giss-xml-signer';
import { extractGissRetryAfterSeconds, isTransientGissError } from './soap/giss-error-classifier';
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
    catch (rawError: any) {
      await this.recordFailedAttempt(ProviderAttemptOperation.GissRecepcionarLote, input.nfseId, rawError);
      const error = GissSoapCallError.unwrap(rawError) as any;
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
      throw this.toProviderError(rawError, error, 'Erro ao enviar lote de RPS ao Giss');
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
    catch (rawError: any) {
      await this.recordFailedAttempt(ProviderAttemptOperation.GissConsultarLote, input.nfseId, rawError);
      const error = GissSoapCallError.unwrap(rawError) as any;
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
      throw this.toProviderError(rawError, error, 'Erro ao consultar status do lote no Giss');
    }
  }

  /**
   * Consulta pela chave natural do RPS. É a única operação capaz de afirmar que a nota **não**
   * existe, e por isso o único caminho de saída de `AWAITING_PROVIDER`.
   *
   * Assinatura obrigatória apesar de o XSD declarar `dsig:Signature` como `minOccurs="0"`: sem ela
   * o Giss responde `V999`/`E174` ("RPS não assinado"). `ConsultarNfseRpsEnvio` não tem atributo
   * `Id`, então só pode ser assinado como documento inteiro — mesma armadilha do `ConsultarLoteRps`.
   */
  public async findNfseByRps(input: FindNfsByRpsInputDto): Promise<FindNfsByRpsOutputDto> {
    const municipioSlug = this.getMunicipioSlug(input.provider);
    const certMaterial = GissPfxLoader.load(input.provider.certFilePath, input.provider.certPasswordEnvVar);

    try {
      const xml = GissConsultarNfseRpsMapper.buildConsultarNfsePorRpsXml(input);
      const signedXml = GissXmlSigner.signWholeDocument(xml, certMaterial);

      const call = await GissSoapClient.postSoapRequest(
        this.httpService,
        municipioSlug,
        GissOperation.ConsultarNfsePorRps,
        signedXml,
        certMaterial,
      );
      await this.recordAttempt(ProviderAttemptOperation.GissConsultarPorRps, input.nfseId, call);

      return GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse(call.outputXml);
    }
    catch (rawError: any) {
      await this.recordFailedAttempt(ProviderAttemptOperation.GissConsultarPorRps, input.nfseId, rawError);
      const error = GissSoapCallError.unwrap(rawError) as any;
      if (error instanceof NfsProviderConfigError) {
        throw error;
      }
      this.logger.error(LogContext.NFS_GENERATION, {
        adapter: 'giss',
        action: 'findNfseByRps',
        rpsNumber: input.rpsNumber,
        error,
        errorMessage: error?.message,
      });
      throw this.toProviderError(rawError, error, 'Erro ao consultar NFS-e por RPS no Giss');
    }
  }

  /**
   * Varredura por período: uma chamada por página de 50 notas, em vez de uma consulta por nota. A
   * resposta traz **todas** as notas do prestador no período, inclusive as emitidas fora deste
   * sistema — quem chama tem de casar pela chave natural do RPS, nunca por contagem.
   */
  public async listIssuedNfseByPeriod(input: ListIssuedNfsInputDto): Promise<ListIssuedNfsOutputDto> {
    const municipioSlug = this.getMunicipioSlug(input.provider);
    const certMaterial = GissPfxLoader.load(input.provider.certFilePath, input.provider.certPasswordEnvVar);

    try {
      const xml = GissConsultarServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml(input);
      const signedXml = GissXmlSigner.signWholeDocument(xml, certMaterial);

      const call = await GissSoapClient.postSoapRequest(
        this.httpService,
        municipioSlug,
        GissOperation.ConsultarNfseServicoPrestado,
        signedXml,
        certMaterial,
      );
      await this.recordAttempt(ProviderAttemptOperation.GissConsultarServicoPrestado, undefined, call);

      return GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(call.outputXml);
    }
    catch (rawError: any) {
      await this.recordFailedAttempt(ProviderAttemptOperation.GissConsultarServicoPrestado, undefined, rawError);
      const error = GissSoapCallError.unwrap(rawError) as any;
      if (error instanceof NfsProviderConfigError) {
        throw error;
      }
      this.logger.error(LogContext.NFS_GENERATION, {
        adapter: 'giss',
        action: 'listIssuedNfseByPeriod',
        error,
        errorMessage: error?.message,
      });
      throw this.toProviderError(rawError, error, 'Erro ao consultar NFS-e por período no Giss');
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
    catch (rawError: any) {
      await this.recordFailedAttempt(ProviderAttemptOperation.GissCancelar, input.nfseId, rawError);
      const error = GissSoapCallError.unwrap(rawError) as any;
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
      throw this.toProviderError(rawError, error, 'Erro ao cancelar NFS-e no Giss');
    }
  }

  /**
   * Até a Onda 3, todo erro do Giss virava `ExternalApiError` — timeout, 429 e XML inválido eram a
   * mesma coisa para a fila, que gastava as cinco tentativas contra qualquer um deles. `rawError`
   * ainda carrega o status HTTP e o código de rede; a causa desembrulhada carrega a mensagem útil.
   */
  private toProviderError(rawError: unknown, cause: any, fallbackMessage: string): Error {
    const message = cause?.message ?? fallbackMessage;

    // Circuito aberto já chega classificado, e com o tempo de espera calculado.
    if (rawError instanceof TransientProviderError) {
      return rawError;
    }

    if (isTransientGissError(rawError)) {
      return new TransientProviderError(message, extractGissRetryAfterSeconds(rawError));
    }

    return new ExternalApiError(message);
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
