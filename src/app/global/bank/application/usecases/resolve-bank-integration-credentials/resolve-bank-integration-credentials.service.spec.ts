import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { BankCertFormat } from 'src/app/global/bank/domain/enums/bank-cert-format.enum';
import { BankIntegrationNotConfiguredError } from 'src/app/global/bank/domain/errors/bank-integration-not-configured.error';
import { BankNotFoundError } from 'src/app/global/bank/domain/errors/bank-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { ICertificateParserGateway } from 'src/infra/certificate-parser/certificate-parser.gateway';
import type { ILocalSecureFileGateway } from 'src/infra/local-secure-file/local-secure-file.gateway';
import type { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import { buildTestTlsMaterial } from 'src/test/fixtures/test-certificate';
import type { BankIntegrationRecord, IBankDao } from '../../persistence/dao/bank-dao.interface';
import { ResolveBankIntegrationCredentials } from './resolve-bank-integration-credentials.service';

function makeRecord(overrides: Partial<BankIntegrationRecord> = {}): BankIntegrationRecord {
  return {
    id: 12,
    drawer: 'Drawer',
    bankName: 'Inter',
    apiUrl: 'https://cdpj.partners.bancointer.com.br/',
    clientIdCiphertext: 'enc-id',
    clientSecretCiphertext: 'enc-secret',
    webhookTokenHash: null,
    certFormat: BankCertFormat.PemPair,
    certFilePath: '12/cert.enc',
    keyFilePath: '12/key.enc',
    certPasswordCiphertext: null,
    certificateNotAfter: null,
    ...overrides,
  };
}

describe('ResolveBankIntegrationCredentials - Unit tests', () => {
  let sut: ResolveBankIntegrationCredentials;
  let dao: IBankDao;
  let crypto: ISecretsCryptoGateway;
  let files: ILocalSecureFileGateway;
  let parser: ICertificateParserGateway;
  const material = buildTestTlsMaterial();

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ResolveBankIntegrationCredentials,
        { provide: TOKENS.BankDao, useValue: createMock<IBankDao>() },
        {
          provide: TOKENS.SecretsCryptoGateway,
          useValue: createMock<ISecretsCryptoGateway>({
            decrypt: jest.fn((value: string) => value.replace('enc-', '')),
            decryptBytes: jest.fn((buf: Buffer) => buf),
          }),
        },
        { provide: TOKENS.LocalSecureFileGateway, useValue: createMock<ILocalSecureFileGateway>() },
        {
          provide: TOKENS.CertificateParserGateway,
          useValue: createMock<ICertificateParserGateway>({
            parsePemPair: jest.fn().mockReturnValue(material),
            parsePfx: jest.fn().mockReturnValue(material),
          }),
        },
      ],
    }).compile();

    sut = module.get(ResolveBankIntegrationCredentials);
    dao = module.get(TOKENS.BankDao);
    crypto = module.get(TOKENS.SecretsCryptoGateway);
    files = module.get(TOKENS.LocalSecureFileGateway);
    parser = module.get(TOKENS.CertificateParserGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw BankNotFoundError when bank does not exist', async() => {
    jest.spyOn(dao, 'findIntegrationById').mockResolvedValue(null);

    await expect(sut.execute(12)).rejects.toThrow(BankNotFoundError);
  });

  it('should throw BankIntegrationNotConfiguredError when keys are missing', async() => {
    jest.spyOn(dao, 'findIntegrationById').mockResolvedValue(makeRecord({
      clientIdCiphertext: null,
    }));

    await expect(sut.execute(12)).rejects.toThrow(BankIntegrationNotConfiguredError);
  });

  it('should decrypt PEM pair credentials and strip trailing slash from apiUrl', async() => {
    // Arrange
    jest.spyOn(dao, 'findIntegrationById').mockResolvedValue(makeRecord());
    jest.spyOn(files, 'read')
      .mockResolvedValueOnce(Buffer.from('cert'))
      .mockResolvedValueOnce(Buffer.from('key'));

    // Act
    const result = await sut.execute(12);

    // Assert
    expect(crypto.decrypt).toHaveBeenCalledWith('enc-id');
    expect(parser.parsePemPair).toHaveBeenCalled();
    expect(result).toEqual({
      bankId: 12,
      apiUrl: 'https://cdpj.partners.bancointer.com.br',
      clientId: 'id',
      clientSecret: 'secret',
      certPem: material.certPem,
      keyPem: material.keyPem,
    });
  });

  it('should extract PEM from PFX when format is PFX', async() => {
    // Arrange
    jest.spyOn(dao, 'findIntegrationById').mockResolvedValue(makeRecord({
      certFormat: BankCertFormat.Pfx,
      keyFilePath: null,
      certPasswordCiphertext: 'enc-pass',
    }));
    jest.spyOn(files, 'read').mockResolvedValue(Buffer.from('pfx'));

    // Act
    const result = await sut.execute(12);

    // Assert
    expect(parser.parsePfx).toHaveBeenCalled();
    expect(result.certPem).toBe(material.certPem);
  });
});
