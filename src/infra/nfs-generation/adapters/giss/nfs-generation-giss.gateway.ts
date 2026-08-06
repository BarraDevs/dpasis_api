import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
import { TOKENS } from 'src/core/di/token';
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
import { GissOperation, GissSoapClient } from './soap/giss-soap-client';

@Injectable()
export class NfsGenerationGissAdapterGateway implements INfsGenerationGateway {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly httpService: HttpService,
  ) {}

  public async issueBatch(input: IssueNfsBatchInputDto): Promise<IssueNfsBatchOutputDto> {
    const municipioSlug = this.getMunicipioSlug(input.provider);
    const certMaterial = GissPfxLoader.load(input.provider.certFilePath, input.provider.certPasswordEnvVar);

    try {
      const { xml, loteId, rpsIds } = GissIssueBatchMapper.buildIssueBatchXml(input);
      // O Giss exige assinatura em dois níveis: cada RPS individual (referenciado pelo próprio Id — sem
      // isso dá E174 "RPS não assinado") e o lote inteiro por último, também referenciado pelo próprio Id
      // (sem isso dá E173 "Lote de RPS não assinado", inclusive na checagem síncrona — testado ao vivo
      // contra produção; a variante com URI vazia/sem Id no lote regrediu pra E173, foi revertida).
      const rpsSignedXml = rpsIds.reduce((currentXml, rpsId) => GissXmlSigner.signElementById(currentXml, rpsId, certMaterial), xml);
      const signedXml = GissXmlSigner.signElementById(rpsSignedXml, loteId, certMaterial);

      const responseXml = await GissSoapClient.postSoapRequest(
        this.httpService,
        municipioSlug,
        GissOperation.RecepcionarLoteRps,
        signedXml,
        certMaterial,
      );

      return GissIssueBatchMapper.parseRecepcionarLoteRpsResponse(responseXml);
    }
    catch (error: any) {
      if (error instanceof NfsProviderConfigError) {
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

      const responseXml = await GissSoapClient.postSoapRequest(
        this.httpService,
        municipioSlug,
        GissOperation.ConsultarLoteRps,
        signedXml,
        certMaterial,
      );

      return GissBatchStatusMapper.parseConsultarLoteRpsResponse(responseXml);
    }
    catch (error: any) {
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

      const responseXml = await GissSoapClient.postSoapRequest(
        this.httpService,
        municipioSlug,
        GissOperation.CancelarNfse,
        signedXml,
        certMaterial,
      );

      return GissCancelNfseMapper.parseCancelarNfseResponse(responseXml);
    }
    catch (error: any) {
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

  private getMunicipioSlug(provider: NfsProviderCredentialsDto): string {
    const slug = provider.vendorConfig?.municipioSlug;
    if (typeof slug !== 'string' || !slug) {
      throw new NfsProviderConfigError('Configuração do prestador não define "municipioSlug" (vendorConfig) para o Giss');
    }
    return slug;
  }
}
