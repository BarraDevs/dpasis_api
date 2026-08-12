import { NfsProviderEnvironment } from '../../dtos/nfs-provider-credentials.dto';
import { NfsNoteStatus } from '../../dtos/find-nfs-servico-prestado.dto';
import { NfsGenerationFakeAdapterGateway } from './nfs-generation-fake.gateway';

const findAllNFseInput = {
  provider: {
    certFilePath: '/certs/x.pfx',
    certPasswordEnvVar: 'X_PASS',
    environment: NfsProviderEnvironment.Demonstration,
    vendorConfig: { municipioSlug: 'demonstracao' },
  },
  providerDocument: '12345678000199',
  page: 1,
  periodFrom: '2026-08-01',
  periodTo: '2026-08-31',
};

describe('NfsGenerationFakeAdapterGateway - Unit tests', () => {
  let sut: NfsGenerationFakeAdapterGateway;

  beforeEach(() => {
    sut = new NfsGenerationFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAllNFse', () => {
    it('should resolve empty array by default and record the call', async() => {
      // Act
      const result = await sut.findAllNFse(findAllNFseInput);

      // Assert
      expect(result).toEqual([]);
      expect(sut.findAllNFseCalls).toEqual([findAllNFseInput]);
    });

    it('should resolve configured findAllNFseResult', async() => {
      // Arrange
      const notes = [{
        nfseNumber: '1',
        verificationCode: 'ABC',
        issueDate: '2026-08-10',
        rpsNumber: 1,
        rpsSeries: 'NFSE',
        takerDocument: null,
        takerName: null,
        serviceAmount: null,
        status: NfsNoteStatus.Normal,
      }];
      sut.findAllNFseResult = notes;

      // Act
      const result = await sut.findAllNFse(findAllNFseInput);

      // Assert
      expect(result).toEqual(notes);
    });

    it('should reject when findAllNFseError is set', async() => {
      // Arrange
      sut.findAllNFseError = new Error('fake failure');

      // Act & Assert
      await expect(sut.findAllNFse(findAllNFseInput)).rejects.toThrow('fake failure');
      expect(sut.findAllNFseCalls).toHaveLength(1);
    });
  });
});
