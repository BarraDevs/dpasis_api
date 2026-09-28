import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { BankIntegrationNotConfiguredError } from 'src/app/global/bank/domain/errors/bank-integration-not-configured.error';
import { TOKENS } from 'src/core/di/token';
import type { BankIntegrationRecord, IBankDao } from '../../persistence/dao/bank-dao.interface';
import { ResolveBankIntegrationCredentials } from '../resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { InspectBankCertificates } from './inspect-bank-certificates.service';

function makeRecord(overrides: Partial<BankIntegrationRecord> = {}): BankIntegrationRecord {
  return {
    id: 4,
    drawer: 'Empresa XYZ',
    bankName: 'Inter',
    apiUrl: 'https://example',
    clientIdCiphertext: 'x',
    clientSecretCiphertext: 'y',
    webhookTokenHash: null,
    certFormat: 'PEM_PAIR',
    certFilePath: '4/cert.enc',
    keyFilePath: '4/key.enc',
    certPasswordCiphertext: null,
    certificateNotAfter: new Date('2027-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('InspectBankCertificates - Unit tests', () => {
  let sut: InspectBankCertificates;
  let dao: IBankDao;
  let resolve: ResolveBankIntegrationCredentials;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        InspectBankCertificates,
        { provide: TOKENS.BankDao, useValue: createMock<IBankDao>() },
        {
          provide: ResolveBankIntegrationCredentials,
          useValue: createMock<ResolveBankIntegrationCredentials>(),
        },
      ],
    }).compile();

    sut = module.get(InspectBankCertificates);
    dao = module.get(TOKENS.BankDao);
    resolve = module.get(ResolveBankIntegrationCredentials);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty list when no bank has a certificate', async() => {
    jest.spyOn(dao, 'findAllWithCertificate').mockResolvedValue([]);

    await expect(sut.execute()).resolves.toEqual([]);
  });

  it('should report a healthy certificate', async() => {
    // Arrange
    const record = makeRecord();
    jest.spyOn(dao, 'findAllWithCertificate').mockResolvedValue([record]);
    jest.spyOn(resolve, 'fromRecord').mockResolvedValue(createMock());

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([{
      bankId: 4,
      owner: 'banco 4 · Empresa XYZ',
      path: '4/cert.enc',
      notAfter: record.certificateNotAfter,
      loadError: null,
    }]);
  });

  it('should capture load errors without throwing', async() => {
    // Arrange
    jest.spyOn(dao, 'findAllWithCertificate').mockResolvedValue([makeRecord()]);
    jest.spyOn(resolve, 'fromRecord').mockRejectedValue(new BankIntegrationNotConfiguredError());

    // Act
    const result = await sut.execute();

    // Assert
    expect(result[0].loadError).toBe('Banco sem credenciais de integração configuradas.');
  });
});
