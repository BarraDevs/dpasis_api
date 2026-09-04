import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
import { NfsBatchSituation } from '../../dtos/nfs-batch-status.dto';
import { ProviderAttemptFakeAdapterGateway } from 'src/infra/provider-attempt/adapters/fake/provider-attempt-fake.gateway';
import { GissSoapCallError } from './soap/giss-soap-call.error';
import { NfsProviderEnvironment } from '../../dtos/nfs-provider-credentials.dto';
import { GissBatchStatusMapper } from './mappers/giss-batch-status.mapper';
import { GissCancelNfseMapper } from './mappers/giss-cancel-nfse.mapper';
import { GissIssueBatchMapper } from './mappers/giss-issue-batch.mapper';
import { NfsGenerationGissAdapterGateway } from './nfs-generation-giss.gateway';
import { GissPfxLoader } from './signing/giss-pfx-loader';
import { GissXmlSigner } from './signing/giss-xml-signer';
import { GissSoapClient } from './soap/giss-soap-client';

jest.mock('./mappers/giss-issue-batch.mapper');
jest.mock('./mappers/giss-batch-status.mapper');
jest.mock('./mappers/giss-cancel-nfse.mapper');
jest.mock('./signing/giss-pfx-loader');
jest.mock('./signing/giss-xml-signer');
jest.mock('./soap/giss-soap-client');

const mockedBuildIssueBatch = GissIssueBatchMapper.buildIssueBatchXml as jest.Mock;
const mockedParseIssueBatch = GissIssueBatchMapper.parseRecepcionarLoteRpsResponse as jest.Mock;
const mockedBuildConsultar = GissBatchStatusMapper.buildConsultarLoteRpsXml as jest.Mock;
const mockedParseConsultar = GissBatchStatusMapper.parseConsultarLoteRpsResponse as jest.Mock;
const mockedBuildCancelar = GissCancelNfseMapper.buildCancelarNfseXml as jest.Mock;
const mockedParseCancelar = GissCancelNfseMapper.parseCancelarNfseResponse as jest.Mock;
const mockedLoadCert = GissPfxLoader.load as jest.Mock;
const mockedSign = GissXmlSigner.signElementById as jest.Mock;
const mockedSignWholeDocument = GissXmlSigner.signWholeDocument as jest.Mock;
const mockedPostSoap = GissSoapClient.postSoapRequest as jest.Mock;

function soapCall(outputXml = '<response/>') {
  return { outputXml, requestBody: '<envelope/>', responseBody: '<raw/>', httpStatus: 200, durationMs: 12 };
}

const certMaterial = { certPem: 'cert', keyPem: 'key' };

const provider = {
  certFilePath: '/certs/x.pfx',
  certPasswordEnvVar: 'X_PASS',
  environment: NfsProviderEnvironment.Demonstration,
  vendorConfig: { municipioSlug: 'demonstracao' },
};

const batchStatusInput = {
  batchProtocol: 'PROTO-123',
  providerDocument: '12345678000199',
  provider,
};

const cancelNfseInput = {
  nfseNumber: '12345',
  providerDocument: '12345678000199',
  providerMunicipalCodeIbge: '3550308',
  cancelReasonCode: 1,
  provider,
};

describe('NfsGenerationGissAdapterGateway - Unit tests', () => {
  let sut: NfsGenerationGissAdapterGateway;
  let httpService: HttpService;
  let logger: ILoggerGateway;
  let attemptRecorder: ProviderAttemptFakeAdapterGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    httpService = createMock<HttpService>();
    logger = createMock<ILoggerGateway>();
    attemptRecorder = new ProviderAttemptFakeAdapterGateway();
    sut = new NfsGenerationGissAdapterGateway(logger, attemptRecorder, httpService);
    mockedLoadCert.mockReturnValue(certMaterial);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('issueBatch', () => {
    it('should throw NfsProviderConfigError when vendorConfig has no municipioSlug', async() => {
      // Act & Assert
      await expect(sut.issueBatch({
        batchNumber: 1,
        provider: { ...provider, vendorConfig: {} },
        rpsList: [],
      })).rejects.toThrow(NfsProviderConfigError);
      await expect(sut.issueBatch({
        batchNumber: 1,
        provider: { ...provider, vendorConfig: {} },
        rpsList: [],
      })).rejects.toThrow('municipioSlug');
    });

    it('should throw NfsProviderConfigError when municipioSlug is empty', async() => {
      // Act & Assert
      await expect(sut.issueBatch({
        batchNumber: 1,
        provider: { ...provider, vendorConfig: { municipioSlug: '' } },
        rpsList: [],
      })).rejects.toThrow(NfsProviderConfigError);
    });

    it('should throw NfsProviderConfigError when municipioSlug is not a string', async() => {
      // Act & Assert
      await expect(sut.issueBatch({
        batchNumber: 1,
        provider: { ...provider, vendorConfig: { municipioSlug: 123 as unknown as string } },
        rpsList: [],
      })).rejects.toThrow(NfsProviderConfigError);
    });

    it('should load the certificate before building the batch XML', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1'] });
      mockedSign.mockReturnValue('<signed-xml/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseIssueBatch.mockReturnValue({ batchProtocol: 'PROTO-123' });

      // Act
      await sut.issueBatch({ batchNumber: 1, provider, rpsList: [] });

      // Assert
      expect(mockedLoadCert).toHaveBeenCalledWith('/certs/x.pfx', 'X_PASS');
      expect(mockedLoadCert.mock.invocationCallOrder[0]).toBeLessThan(mockedBuildIssueBatch.mock.invocationCallOrder[0]);
    });

    it('should build, sign, post and parse the batch on success', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1'] });
      mockedSign.mockReturnValue('<signed-xml/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseIssueBatch.mockReturnValue({ batchProtocol: 'PROTO-123' });

      // Act
      const result = await sut.issueBatch({ batchNumber: 1, provider, rpsList: [] });

      // Assert
      expect(mockedSign).toHaveBeenCalledWith('<xml/>', 'rps1', certMaterial);
      expect(mockedSign).toHaveBeenCalledWith('<signed-xml/>', 'lote1', certMaterial);
      expect(mockedPostSoap).toHaveBeenCalledWith(httpService, 'demonstracao', 'RecepcionarLoteRps', '<signed-xml/>', certMaterial);
      expect(result).toEqual({ batchProtocol: 'PROTO-123' });
    });

    it('should sign each RPS individually before signing the batch when multiple RPS are present', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1', 'rps2'] });
      mockedSign.mockImplementation((xml: string, id: string) => `${xml}-${id}`);
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseIssueBatch.mockReturnValue({ batchProtocol: 'PROTO-123' });

      // Act
      await sut.issueBatch({ batchNumber: 1, provider, rpsList: [] });

      // Assert
      expect(mockedSign).toHaveBeenNthCalledWith(1, '<xml/>', 'rps1', certMaterial);
      expect(mockedSign).toHaveBeenNthCalledWith(2, '<xml/>-rps1', 'rps2', certMaterial);
      expect(mockedSign).toHaveBeenNthCalledWith(3, '<xml/>-rps1-rps2', 'lote1', certMaterial);
      expect(mockedPostSoap).toHaveBeenCalledWith(httpService, 'demonstracao', 'RecepcionarLoteRps', '<xml/>-rps1-rps2-lote1', certMaterial);
    });

    it('should wrap unexpected errors as ExternalApiError and log them', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1'] });
      mockedSign.mockReturnValue('<signed-xml/>');
      mockedPostSoap.mockRejectedValue(new Error('timeout'));

      // Act & Assert
      await expect(sut.issueBatch({ batchNumber: 1, provider, rpsList: [] })).rejects.toThrow(ExternalApiError);
      await expect(sut.issueBatch({ batchNumber: 1, provider, rpsList: [] })).rejects.toThrow('timeout');
      expect(logger.error).toHaveBeenCalledWith(LogContext.NFS_GENERATION, expect.objectContaining({
        adapter: 'giss',
        action: 'issueBatch',
        batchNumber: 1,
        errorMessage: 'timeout',
      }));
    });

    it('should record the attempt with the raw bodies when nfseId is given', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1'] });
      mockedSign.mockReturnValue('<signed-xml/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseIssueBatch.mockReturnValue({ batchProtocol: 'PROTO-123' });

      // Act
      await sut.issueBatch({ nfseId: 55, batchNumber: 1, provider, rpsList: [] });

      // Assert
      expect(attemptRecorder.attempts).toEqual([{
        nfseId: 55,
        operation: 'RECEPCIONAR_LOTE',
        requestBody: '<envelope/>',
        responseBody: '<raw/>',
        httpStatus: 200,
        durationMs: 12,
        errorClass: null,
      }]);
    });

    it('should record the attempt when the call fails, with the error class', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1'] });
      mockedSign.mockReturnValue('<signed-xml/>');
      mockedPostSoap.mockRejectedValue(new GissSoapCallError(new Error('timeout'), {
        requestBody: '<envelope/>',
        responseBody: null,
        httpStatus: null,
        durationMs: 9,
      }));

      // Act
      await expect(sut.issueBatch({ nfseId: 55, batchNumber: 1, provider, rpsList: [] })).rejects.toThrow(ExternalApiError);

      // Assert
      expect(attemptRecorder.attempts).toEqual([expect.objectContaining({
        nfseId: 55,
        operation: 'RECEPCIONAR_LOTE',
        errorClass: 'Error',
        httpStatus: null,
      })]);
    });

    it('should skip the attempt trail when there is no nfseId to anchor it to', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1'] });
      mockedSign.mockReturnValue('<signed-xml/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseIssueBatch.mockReturnValue({ batchProtocol: 'PROTO-123' });

      // Act
      await sut.issueBatch({ batchNumber: 1, provider, rpsList: [] });

      // Assert
      expect(attemptRecorder.attempts).toHaveLength(0);
    });

    it('should use the default ExternalApiError message when the caught error has no message', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1'] });
      mockedSign.mockReturnValue('<signed-xml/>');
      mockedPostSoap.mockRejectedValue({});

      // Act & Assert
      await expect(sut.issueBatch({ batchNumber: 1, provider, rpsList: [] })).rejects.toThrow('Erro ao enviar lote de RPS ao Giss');
    });

    it('should let NfsProviderConfigError from the cert loader propagate without wrapping', async() => {
      // Arrange
      mockedLoadCert.mockImplementation(() => {
        throw new NfsProviderConfigError('senha incorreta');
      });

      // Act & Assert
      await expect(sut.issueBatch({ batchNumber: 1, provider, rpsList: [] })).rejects.toThrow(NfsProviderConfigError);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('getBatchStatus', () => {
    it('should throw NfsProviderConfigError when vendorConfig has no municipioSlug', async() => {
      // Act & Assert
      await expect(sut.getBatchStatus({
        ...batchStatusInput,
        provider: { ...provider, vendorConfig: {} },
      })).rejects.toThrow(NfsProviderConfigError);
      await expect(sut.getBatchStatus({
        ...batchStatusInput,
        provider: { ...provider, vendorConfig: {} },
      })).rejects.toThrow('municipioSlug');
    });

    it('should throw NfsProviderConfigError when municipioSlug is empty', async() => {
      // Act & Assert
      await expect(sut.getBatchStatus({
        ...batchStatusInput,
        provider: { ...provider, vendorConfig: { municipioSlug: '' } },
      })).rejects.toThrow(NfsProviderConfigError);
    });

    it('should load the certificate before building the consulta XML', async() => {
      // Arrange
      mockedBuildConsultar.mockReturnValue('<consulta/>');
      mockedSignWholeDocument.mockReturnValue('<consulta-assinada/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseConsultar.mockReturnValue({ situation: NfsBatchSituation.Success, issuedNotes: [] });

      // Act
      await sut.getBatchStatus(batchStatusInput);

      // Assert
      expect(mockedLoadCert).toHaveBeenCalledWith('/certs/x.pfx', 'X_PASS');
      expect(mockedLoadCert.mock.invocationCallOrder[0]).toBeLessThan(mockedBuildConsultar.mock.invocationCallOrder[0]);
    });

    it('should build, sign, post and parse the status query', async() => {
      // Arrange
      mockedBuildConsultar.mockReturnValue('<consulta/>');
      mockedSignWholeDocument.mockReturnValue('<consulta-assinada/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseConsultar.mockReturnValue({ situation: NfsBatchSituation.Success, issuedNotes: [] });

      // Act
      const result = await sut.getBatchStatus(batchStatusInput);

      // Assert
      expect(mockedSignWholeDocument).toHaveBeenCalledWith('<consulta/>', certMaterial);
      expect(mockedPostSoap).toHaveBeenCalledWith(httpService, 'demonstracao', 'ConsultarLoteRps', '<consulta-assinada/>', certMaterial);
      expect(result.situation).toBe(NfsBatchSituation.Success);
    });

    it('should wrap unexpected errors as ExternalApiError and log them', async() => {
      // Arrange
      mockedBuildConsultar.mockReturnValue('<consulta/>');
      mockedSignWholeDocument.mockReturnValue('<consulta-assinada/>');
      mockedPostSoap.mockRejectedValue(new Error('boom'));

      // Act & Assert
      await expect(sut.getBatchStatus(batchStatusInput)).rejects.toThrow(ExternalApiError);
      await expect(sut.getBatchStatus(batchStatusInput)).rejects.toThrow('boom');
      expect(logger.error).toHaveBeenCalledWith(LogContext.NFS_GENERATION, expect.objectContaining({
        adapter: 'giss',
        action: 'getBatchStatus',
        batchProtocol: 'PROTO-123',
        errorMessage: 'boom',
      }));
    });

    it('should use the default ExternalApiError message when the caught error has no message', async() => {
      // Arrange
      mockedBuildConsultar.mockReturnValue('<consulta/>');
      mockedSignWholeDocument.mockReturnValue('<consulta-assinada/>');
      mockedPostSoap.mockRejectedValue({});

      // Act & Assert
      await expect(sut.getBatchStatus(batchStatusInput)).rejects.toThrow('Erro ao consultar status do lote no Giss');
    });

    it('should let NfsProviderConfigError from the cert loader propagate without wrapping', async() => {
      // Arrange
      mockedLoadCert.mockImplementation(() => {
        throw new NfsProviderConfigError('senha incorreta');
      });

      // Act & Assert
      await expect(sut.getBatchStatus(batchStatusInput)).rejects.toThrow(NfsProviderConfigError);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should record the attempt with CONSULTAR_LOTE when nfseId is given', async() => {
      // Arrange
      mockedBuildConsultar.mockReturnValue('<consulta/>');
      mockedSignWholeDocument.mockReturnValue('<consulta-assinada/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseConsultar.mockReturnValue({ situation: NfsBatchSituation.Success, issuedNotes: [] });

      // Act
      await sut.getBatchStatus({ ...batchStatusInput, nfseId: 77 });

      // Assert
      expect(attemptRecorder.attempts).toEqual([{
        nfseId: 77,
        operation: 'CONSULTAR_LOTE',
        requestBody: '<envelope/>',
        responseBody: '<raw/>',
        httpStatus: 200,
        durationMs: 12,
        errorClass: null,
      }]);
    });
  });

  describe('cancelNfse', () => {
    it('should throw NfsProviderConfigError when vendorConfig has no municipioSlug', async() => {
      // Act & Assert
      await expect(sut.cancelNfse({
        ...cancelNfseInput,
        provider: { ...provider, vendorConfig: {} },
      })).rejects.toThrow(NfsProviderConfigError);
      await expect(sut.cancelNfse({
        ...cancelNfseInput,
        provider: { ...provider, vendorConfig: {} },
      })).rejects.toThrow('municipioSlug');
    });

    it('should throw NfsProviderConfigError when municipioSlug is empty', async() => {
      // Act & Assert
      await expect(sut.cancelNfse({
        ...cancelNfseInput,
        provider: { ...provider, vendorConfig: { municipioSlug: '' } },
      })).rejects.toThrow(NfsProviderConfigError);
    });

    it('should load the certificate before building the cancel XML', async() => {
      // Arrange
      mockedBuildCancelar.mockReturnValue({ xml: '<cancel/>', infId: 'cancelamento1' });
      mockedSign.mockReturnValue('<cancel-assinado/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseCancelar.mockReturnValue({ confirmedAt: '2026-07-29T12:00:00' });

      // Act
      await sut.cancelNfse(cancelNfseInput);

      // Assert
      expect(mockedLoadCert).toHaveBeenCalledWith('/certs/x.pfx', 'X_PASS');
      expect(mockedLoadCert.mock.invocationCallOrder[0]).toBeLessThan(mockedBuildCancelar.mock.invocationCallOrder[0]);
    });

    it('should build, sign, post and parse the cancel request on success', async() => {
      // Arrange
      mockedBuildCancelar.mockReturnValue({ xml: '<cancel/>', infId: 'cancelamento1' });
      mockedSign.mockReturnValue('<cancel-assinado/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseCancelar.mockReturnValue({ confirmedAt: '2026-07-29T12:00:00' });

      // Act
      const result = await sut.cancelNfse(cancelNfseInput);

      // Assert
      expect(mockedBuildCancelar).toHaveBeenCalledWith(cancelNfseInput);
      expect(mockedSign).toHaveBeenCalledWith('<cancel/>', 'cancelamento1', certMaterial);
      expect(mockedPostSoap).toHaveBeenCalledWith(httpService, 'demonstracao', 'CancelarNfse', '<cancel-assinado/>', certMaterial);
      expect(result).toEqual({ confirmedAt: '2026-07-29T12:00:00' });
    });

    it('should wrap unexpected errors as ExternalApiError and log them', async() => {
      // Arrange
      mockedBuildCancelar.mockReturnValue({ xml: '<cancel/>', infId: 'cancelamento1' });
      mockedSign.mockReturnValue('<cancel-assinado/>');
      mockedPostSoap.mockRejectedValue(new Error('rejeitado'));

      // Act & Assert
      await expect(sut.cancelNfse(cancelNfseInput)).rejects.toThrow(ExternalApiError);
      await expect(sut.cancelNfse(cancelNfseInput)).rejects.toThrow('rejeitado');
      expect(logger.error).toHaveBeenCalledWith(LogContext.NFS_GENERATION, expect.objectContaining({
        adapter: 'giss',
        action: 'cancelNfse',
        nfseNumber: '12345',
        errorMessage: 'rejeitado',
      }));
    });

    it('should use the default ExternalApiError message when the caught error has no message', async() => {
      // Arrange
      mockedBuildCancelar.mockReturnValue({ xml: '<cancel/>', infId: 'cancelamento1' });
      mockedSign.mockReturnValue('<cancel-assinado/>');
      mockedPostSoap.mockRejectedValue({});

      // Act & Assert
      await expect(sut.cancelNfse(cancelNfseInput)).rejects.toThrow('Erro ao cancelar NFS-e no Giss');
    });

    it('should let NfsProviderConfigError from the cert loader propagate without wrapping', async() => {
      // Arrange
      mockedLoadCert.mockImplementation(() => {
        throw new NfsProviderConfigError('senha incorreta');
      });

      // Act & Assert
      await expect(sut.cancelNfse(cancelNfseInput)).rejects.toThrow(NfsProviderConfigError);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should record the attempt with CANCELAR when nfseId is given', async() => {
      // Arrange
      mockedBuildCancelar.mockReturnValue({ xml: '<cancel/>', infId: 'cancelamento1' });
      mockedSign.mockReturnValue('<cancel-assinado/>');
      mockedPostSoap.mockResolvedValue(soapCall());
      mockedParseCancelar.mockReturnValue({ confirmedAt: '2026-07-29T12:00:00' });

      // Act
      await sut.cancelNfse({ ...cancelNfseInput, nfseId: 88 });

      // Assert
      expect(attemptRecorder.attempts).toEqual([{
        nfseId: 88,
        operation: 'CANCELAR',
        requestBody: '<envelope/>',
        responseBody: '<raw/>',
        httpStatus: 200,
        durationMs: 12,
        errorClass: null,
      }]);
    });
  });
});
