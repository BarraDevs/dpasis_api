import { Inject, Injectable } from '@nestjs/common';
import { BankCertFormat } from 'src/app/global/bank/domain/enums/bank-cert-format.enum';
import { BankIntegrationNotConfiguredError } from 'src/app/global/bank/domain/errors/bank-integration-not-configured.error';
import { BankNotFoundError } from 'src/app/global/bank/domain/errors/bank-not-found.error';
import { InvalidBankCertificateError } from 'src/app/global/bank/domain/errors/invalid-bank-certificate.error';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import type { ICertificateParserGateway } from 'src/infra/certificate-parser/certificate-parser.gateway';
import { BankPaymentCredentialsDto } from 'src/infra/bank-payment/dtos/bank-payment-credentials.dto';
import type { ILocalSecureFileGateway } from 'src/infra/local-secure-file/local-secure-file.gateway';
import type { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import type { BankIntegrationRecord, IBankDao } from '../../persistence/dao/bank-dao.interface';

@Injectable()
export class ResolveBankIntegrationCredentials {
  constructor(
    @Inject(TOKENS.BankDao) private readonly dao: IBankDao,
    @Inject(TOKENS.SecretsCryptoGateway) private readonly secretsCrypto: ISecretsCryptoGateway,
    @Inject(TOKENS.LocalSecureFileGateway) private readonly localSecureFile: ILocalSecureFileGateway,
    @Inject(TOKENS.CertificateParserGateway) private readonly certificateParser: ICertificateParserGateway,
  ) {}

  public async execute(bankId: number): Promise<BankPaymentCredentialsDto> {
    const record = await this.dao.findIntegrationById(bankId);
    if (!record) {
      throw new BankNotFoundError();
    }

    return this.fromRecord(record);
  }

  public async fromRecord(record: BankIntegrationRecord): Promise<BankPaymentCredentialsDto> {
    if (
      !record.apiUrl?.trim()
      || !record.clientIdCiphertext
      || !record.clientSecretCiphertext
      || !record.certFilePath
      || !record.certFormat
    ) {
      throw new BankIntegrationNotConfiguredError();
    }

    const clientId = this.secretsCrypto.decrypt(record.clientIdCiphertext);
    const clientSecret = this.secretsCrypto.decrypt(record.clientSecretCiphertext);
    const { certPem, keyPem } = await this.loadPem(record);

    return {
      bankId: record.id,
      apiUrl: record.apiUrl.trim().replace(/\/+$/, ''),
      clientId,
      clientSecret,
      certPem,
      keyPem,
    };
  }

  private async loadPem(record: BankIntegrationRecord): Promise<{ certPem: string; keyPem: string }> {
    try {
      if (record.certFormat === BankCertFormat.Pfx) {
        if (!record.certPasswordCiphertext) {
          throw new BankIntegrationNotConfiguredError();
        }

        const pfx = this.secretsCrypto.decryptBytes(await this.localSecureFile.read(record.certFilePath!));
        const password = this.secretsCrypto.decrypt(record.certPasswordCiphertext);
        const material = this.certificateParser.parsePfx(pfx, password);
        return { certPem: material.certPem, keyPem: material.keyPem };
      }

      if (record.certFormat === BankCertFormat.PemPair) {
        if (!record.keyFilePath) {
          throw new BankIntegrationNotConfiguredError();
        }

        const cert = this.secretsCrypto.decryptBytes(await this.localSecureFile.read(record.certFilePath!));
        const key = this.secretsCrypto.decryptBytes(await this.localSecureFile.read(record.keyFilePath));
        const material = this.certificateParser.parsePemPair(cert, key);
        return { certPem: material.certPem, keyPem: material.keyPem };
      }
    }
    catch (error) {
      if (error instanceof BankIntegrationNotConfiguredError || error instanceof BankNotFoundError) {
        throw error;
      }
      if (error instanceof AppException) {
        throw new InvalidBankCertificateError(error.message);
      }
      throw new InvalidBankCertificateError();
    }

    throw new BankIntegrationNotConfiguredError();
  }
}
