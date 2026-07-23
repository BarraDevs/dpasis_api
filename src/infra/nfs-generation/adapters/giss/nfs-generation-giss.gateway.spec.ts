import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { NfsProviderConfigError } from 'src/shared/errors/nfs-provider-config.error';
import { NfsBatchSituation } from '../../dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from '../../dtos/nfs-provider-credentials.dto';
import { buildGissConsultarLoteRpsXml, parseGissConsultarLoteRpsResponse } from './mappers/giss-batch-status.mapper';
import { buildGissIssueBatchXml, parseGissRecepcionarLoteRpsResponse } from './mappers/giss-issue-batch.mapper';
import { NfsGenerationGissAdapterGateway } from './nfs-generation-giss.gateway';
import { loadGissCertMaterial } from './signing/giss-pfx-loader';
import { signGissElementById } from './signing/giss-xml-signer';
import { postGissSoapRequest } from './soap/giss-soap-client';

jest.mock('./mappers/giss-issue-batch.mapper');
jest.mock('./mappers/giss-batch-status.mapper');
jest.mock('./signing/giss-pfx-loader');
jest.mock('./signing/giss-xml-signer');
jest.mock('./soap/giss-soap-client');

const mockedBuildIssueBatch = buildGissIssueBatchXml as jest.Mock;
const mockedParseIssueBatch = parseGissRecepcionarLoteRpsResponse as jest.Mock;
const mockedBuildConsultar = buildGissConsultarLoteRpsXml as jest.Mock;
const mockedParseConsultar = parseGissConsultarLoteRpsResponse as jest.Mock;
const mockedLoadCert = loadGissCertMaterial as jest.Mock;
const mockedSign = signGissElementById as jest.Mock;
const mockedPostSoap = postGissSoapRequest as jest.Mock;

const provider = {
  certFilePath: '/certs/x.pfx',
  certPasswordEnvVar: 'X_PASS',
  environment: NfsProviderEnvironment.Demonstration,
  vendorConfig: { municipioSlug: 'demonstracao' },
};

describe('NfsGenerationGissAdapterGateway - Unit tests', () => {
  let sut: NfsGenerationGissAdapterGateway;
  let httpService: HttpService;
  let logger: ILoggerGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    httpService = createMock<HttpService>();
    logger = createMock<ILoggerGateway>();
    sut = new NfsGenerationGissAdapterGateway(logger, httpService);
    mockedLoadCert.mockReturnValue({ certPem: 'cert', keyPem: 'key' });
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
    });

    it('should build, sign, post and parse the batch on success', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1'] });
      mockedSign.mockReturnValue('<signed-xml/>');
      mockedPostSoap.mockResolvedValue('<response/>');
      mockedParseIssueBatch.mockReturnValue({ batchProtocol: 'PROTO-123' });

      // Act
      const result = await sut.issueBatch({ batchNumber: 1, provider, rpsList: [] });

      // Assert
      expect(mockedSign).toHaveBeenCalledWith('<xml/>', 'rps1', { certPem: 'cert', keyPem: 'key' });
      expect(mockedSign).toHaveBeenCalledWith('<signed-xml/>', 'lote1', { certPem: 'cert', keyPem: 'key' });
      expect(mockedPostSoap).toHaveBeenCalledWith(httpService, 'demonstracao', 'RecepcionarLoteRps', '<signed-xml/>', { certPem: 'cert', keyPem: 'key' });
      expect(result).toEqual({ batchProtocol: 'PROTO-123' });
    });

    it('should wrap unexpected errors as ExternalApiError and log them', async() => {
      // Arrange
      mockedBuildIssueBatch.mockReturnValue({ xml: '<xml/>', loteId: 'lote1', rpsIds: ['rps1'] });
      mockedSign.mockReturnValue('<signed-xml/>');
      mockedPostSoap.mockRejectedValue(new Error('timeout'));

      // Act & Assert
      await expect(sut.issueBatch({ batchNumber: 1, provider, rpsList: [] })).rejects.toThrow(ExternalApiError);
      expect(logger.error).toHaveBeenCalled();
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
    it('should build, post and parse the status query', async() => {
      // Arrange
      mockedBuildConsultar.mockReturnValue('<consulta/>');
      mockedPostSoap.mockResolvedValue('<response/>');
      mockedParseConsultar.mockReturnValue({ situation: NfsBatchSituation.Success, issuedNotes: [] });

      // Act
      const result = await sut.getBatchStatus({ batchProtocol: 'PROTO-123', providerDocument: '12345678000199', provider });

      // Assert
      expect(mockedPostSoap).toHaveBeenCalledWith(httpService, 'demonstracao', 'ConsultarLoteRps', '<consulta/>', { certPem: 'cert', keyPem: 'key' });
      expect(result.situation).toBe(NfsBatchSituation.Success);
    });

    it('should wrap unexpected errors as ExternalApiError', async() => {
      // Arrange
      mockedBuildConsultar.mockReturnValue('<consulta/>');
      mockedPostSoap.mockRejectedValue(new Error('boom'));

      // Act & Assert
      await expect(sut.getBatchStatus({ batchProtocol: 'PROTO-123', providerDocument: '12345678000199', provider })).rejects.toThrow(ExternalApiError);
    });
  });
});
