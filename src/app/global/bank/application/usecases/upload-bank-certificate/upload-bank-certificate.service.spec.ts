import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { BankCertFormat } from 'src/app/global/bank/domain/enums/bank-cert-format.enum';
import { BankCertificateRequiredError } from 'src/app/global/bank/domain/errors/bank-certificate-required.error';
import { BankNotFoundError } from 'src/app/global/bank/domain/errors/bank-not-found.error';
import { InvalidBankCertificateError } from 'src/app/global/bank/domain/errors/invalid-bank-certificate.error';
import { FileTooBigError } from 'src/app/upload-file/domain/errors/file-too-big.error';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import type { ICertificateParserGateway } from 'src/infra/certificate-parser/certificate-parser.gateway';
import type { ILocalSecureFileGateway } from 'src/infra/local-secure-file/local-secure-file.gateway';
import type { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import { buildTestTlsMaterial } from 'src/test/fixtures/test-certificate';
import type { BankIntegrationRecord, IBankDao } from '../../persistence/dao/bank-dao.interface';
import { UploadBankCertificate } from './upload-bank-certificate.service';

function makeFile(name: string, contents: Buffer): Express.Multer.File {
  return createMock<Express.Multer.File>({
    fieldname: name,
    originalname: name,
    buffer: contents,
    size: contents.length,
  });
}

function makeRecord(overrides: Partial<BankIntegrationRecord> = {}): BankIntegrationRecord {
  return {
    id: 12,
    drawer: 'Drawer',
    bankName: 'Inter',
    apiUrl: 'https://cdpj.partners.bancointer.com.br',
    clientIdCiphertext: 'enc:id',
    clientSecretCiphertext: 'enc:secret',
    webhookTokenHash: null,
    certFormat: null,
    certFilePath: null,
    keyFilePath: null,
    certPasswordCiphertext: null,
    certificateNotAfter: null,
    ...overrides,
  };
}

describe('UploadBankCertificate - Unit tests', () => {
  let sut: UploadBankCertificate;
  let dao: IBankDao;
  let parser: ICertificateParserGateway;
  let crypto: ISecretsCryptoGateway;
  let files: ILocalSecureFileGateway;
  const material = buildTestTlsMaterial();

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        UploadBankCertificate,
        { provide: TOKENS.BankDao, useValue: createMock<IBankDao>() },
        {
          provide: TOKENS.CertificateParserGateway,
          useValue: createMock<ICertificateParserGateway>({
            parsePfx: jest.fn().mockReturnValue(material),
            parsePemPair: jest.fn().mockReturnValue(material),
          }),
        },
        {
          provide: TOKENS.SecretsCryptoGateway,
          useValue: createMock<ISecretsCryptoGateway>({
            encrypt: jest.fn((value: string) => `enc:${value}`),
            encryptBytes: jest.fn((buf: Buffer) => Buffer.from(`enc:${buf.toString('base64')}`)),
          }),
        },
        { provide: TOKENS.LocalSecureFileGateway, useValue: createMock<ILocalSecureFileGateway>() },
      ],
    }).compile();

    sut = module.get(UploadBankCertificate);
    dao = module.get(TOKENS.BankDao);
    parser = module.get(TOKENS.CertificateParserGateway);
    crypto = module.get(TOKENS.SecretsCryptoGateway);
    files = module.get(TOKENS.LocalSecureFileGateway);
    jest.spyOn(dao, 'findIntegrationById').mockResolvedValue(makeRecord());
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw BankNotFoundError when bank does not exist', async() => {
    jest.spyOn(dao, 'findIntegrationById').mockResolvedValue(null);

    await expect(sut.execute(12, { pfx: [makeFile('a.pfx', Buffer.from('x'))] }, { pfxPassword: 'secret' }))
      .rejects.toThrow(BankNotFoundError);
  });

  it('should reject when both PFX and PEM pair are sent', async() => {
    await expect(sut.execute(12, {
      pfx: [makeFile('a.pfx', Buffer.from('x'))],
      cert: [makeFile('a.crt', Buffer.from('c'))],
      key: [makeFile('a.key', Buffer.from('k'))],
    }, { pfxPassword: 'secret' })).rejects.toThrow(BankCertificateRequiredError);
  });

  it('should reject PFX without password', async() => {
    await expect(sut.execute(12, { pfx: [makeFile('a.pfx', Buffer.from('x'))] }, {}))
      .rejects.toThrow(BankCertificateRequiredError);
  });

  it('should reject cert without key', async() => {
    await expect(sut.execute(12, { cert: [makeFile('a.crt', Buffer.from('c'))] }, {}))
      .rejects.toThrow(BankCertificateRequiredError);
  });

  it('should reject files larger than 1MB', async() => {
    const huge = Buffer.alloc((1024 * 1024) + 1);

    await expect(sut.execute(12, { pfx: [makeFile('a.pfx', huge)] }, { pfxPassword: 'secret' }))
      .rejects.toThrow(FileTooBigError);
  });

  it('should wrap parser failures as InvalidBankCertificateError', async() => {
    jest.spyOn(parser, 'parsePfx').mockImplementation(() => {
      throw new AppException('senha incorreta');
    });

    await expect(sut.execute(12, { pfx: [makeFile('a.pfx', Buffer.from('x'))] }, { pfxPassword: 'secret' }))
      .rejects.toThrow(InvalidBankCertificateError);
  });

  it('should persist encrypted PFX and delete leftover PEM key', async() => {
    // Arrange
    jest.spyOn(dao, 'findIntegrationById').mockResolvedValue(makeRecord({ keyFilePath: '12/key.enc' }));
    const pfx = makeFile('inter.pfx', Buffer.from('pfx-bytes'));

    // Act
    const result = await sut.execute(12, { pfx: [pfx] }, { pfxPassword: 'pfx-pass' });

    // Assert
    expect(parser.parsePfx).toHaveBeenCalledWith(pfx.buffer, 'pfx-pass');
    expect(files.write).toHaveBeenCalledWith('12/cert.enc', expect.any(Buffer));
    expect(files.delete).toHaveBeenCalledWith('12/key.enc');
    expect(crypto.encrypt).toHaveBeenCalledWith('pfx-pass');
    expect(dao.updateIntegration).toHaveBeenCalledWith(12, expect.objectContaining({
      certFormat: BankCertFormat.Pfx,
      certFilePath: '12/cert.enc',
      keyFilePath: null,
      certPasswordCiphertext: 'enc:pfx-pass',
      certificateNotAfter: material.notAfter,
    }));
    expect(result).toEqual({ message: 'Certificado do banco atualizado com sucesso' });
  });

  it('should persist encrypted PEM pair', async() => {
    // Arrange
    const cert = makeFile('inter.crt', Buffer.from(material.certPem));
    const key = makeFile('inter.key', Buffer.from(material.keyPem));

    // Act
    await sut.execute(12, { cert: [cert], key: [key] }, {});

    // Assert
    expect(parser.parsePemPair).toHaveBeenCalledWith(cert.buffer, key.buffer);
    expect(files.write).toHaveBeenCalledWith('12/cert.enc', expect.any(Buffer));
    expect(files.write).toHaveBeenCalledWith('12/key.enc', expect.any(Buffer));
    expect(dao.updateIntegration).toHaveBeenCalledWith(12, expect.objectContaining({
      certFormat: BankCertFormat.PemPair,
      certFilePath: '12/cert.enc',
      keyFilePath: '12/key.enc',
      certPasswordCiphertext: null,
    }));
  });
});
