import { FindNfsByRpsInputDto } from '../../dtos/find-nfs-by-rps.dto';
import { ListIssuedNfsInputDto } from '../../dtos/list-issued-nfs.dto';
import { NfsGenerationFakeAdapterGateway } from './nfs-generation-fake.gateway';

const findByRpsInput = { rpsNumber: 41, rpsSeries: 'NFSE' } as FindNfsByRpsInputDto;
const listInput = { startDate: '2026-09-03', endDate: '2026-09-03', page: 1 } as ListIssuedNfsInputDto;

describe('NfsGenerationFakeAdapterGateway - Unit tests', () => {
  let sut: NfsGenerationFakeAdapterGateway;

  beforeEach(() => {
    sut = new NfsGenerationFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findNfseByRps', () => {
    it('should record the call and answer "not found" by default', async() => {
      // Act
      const result = await sut.findNfseByRps(findByRpsInput);

      // Assert
      expect(sut.findNfseByRpsCalls).toEqual([findByRpsInput]);
      expect(result).toEqual({ found: false });
    });

    it('should answer with the configured result', async() => {
      // Arrange
      sut.findNfseByRpsResult = {
        found: true,
        note: { rpsNumber: 41, rpsSeries: 'NFSE', nfseNumber: '1', verificationCode: 'V', issueDate: 'D' },
      };

      // Act
      const result = await sut.findNfseByRps(findByRpsInput);

      // Assert
      expect(result.found).toBe(true);
    });

    it('should reject with the configured error', async() => {
      // Arrange
      sut.findNfseByRpsError = new Error('giss fora do ar');

      // Act & Assert
      await expect(sut.findNfseByRps(findByRpsInput)).rejects.toThrow('giss fora do ar');
    });
  });

  describe('listIssuedNfseByPeriod', () => {
    it('should record the call and answer an empty last page by default', async() => {
      // Act
      const result = await sut.listIssuedNfseByPeriod(listInput);

      // Assert
      expect(sut.listIssuedNfseByPeriodCalls).toEqual([listInput]);
      expect(result).toEqual({ notes: [], endOfPages: true });
    });

    it('should reject with the configured error', async() => {
      // Arrange
      sut.listIssuedNfseByPeriodError = new Error('timeout');

      // Act & Assert
      await expect(sut.listIssuedNfseByPeriod(listInput)).rejects.toThrow('timeout');
    });
  });
});
