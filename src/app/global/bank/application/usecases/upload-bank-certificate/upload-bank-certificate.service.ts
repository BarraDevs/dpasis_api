import { Inject, Injectable } from '@nestjs/common';
import { BankCertFormat } from 'src/app/global/bank/domain/enums/bank-cert-format.enum';
import { BankCertificateRequiredError } from 'src/app/global/bank/domain/errors/bank-certificate-required.error';
import { BankNotFoundError } from 'src/app/global/bank/domain/errors/bank-not-found.error';
import { InvalidBankCertificateError } from 'src/app/global/bank/domain/errors/invalid-bank-certificate.error';
import { FileTooBigError } from 'src/app/upload-file/domain/errors/file-too-big.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { AppException } from 'src/core/filters/app.exception';
import type { ICertificateParserGateway } from 'src/infra/certificate-parser/certificate-parser.gateway';
import type { ILocalSecureFileGateway } from 'src/infra/local-secure-file/local-secure-file.gateway';
import type { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { UploadBankCertificateFiles, UploadBankCertificateInputDto } from './dtos/upload-bank-certificate.dto';

const MAX_CERTIFICATE_BYTES = 1024 * 1024;

@Injectable()
export class UploadBankCertificate {
  constructor(
    @Inject(TOKENS.BankDao) private readonly dao: IBankDao,
    @Inject(TOKENS.CertificateParserGateway) private readonly certificateParser: ICertificateParserGateway,
    @Inject(TOKENS.SecretsCryptoGateway) private readonly secretsCrypto: ISecretsCryptoGateway,
    @Inject(TOKENS.LocalSecureFileGateway) private readonly localSecureFile: ILocalSecureFileGateway,
  ) {}

  public async execute(
    id: number,
    files: UploadBankCertificateFiles,
    input: UploadBankCertificateInputDto,
  ): Promise<SuccessMessage> {
    const bank = await this.dao.findIntegrationById(id);
    if (!bank) {
      throw new BankNotFoundError();
    }

    const pfxFile = files.pfx?.[0];
    const certFile = files.cert?.[0];
    const keyFile = files.key?.[0];
    const hasPfx = Boolean(pfxFile);
    const hasPemPair = Boolean(certFile && keyFile);

    if (hasPfx === hasPemPair || (certFile && !keyFile) || (keyFile && !certFile)) {
      throw new BankCertificateRequiredError();
    }

    if (pfxFile) {
      this.assertSize(pfxFile);
      const password = input.pfxPassword?.trim();
      if (!password) {
        throw new BankCertificateRequiredError();
      }

      try {
        const material = this.certificateParser.parsePfx(pfxFile.buffer, password);
        const certFilePath = `${id}/cert.enc`;
        await this.localSecureFile.write(certFilePath, this.secretsCrypto.encryptBytes(pfxFile.buffer));
        if (bank.keyFilePath) {
          await this.localSecureFile.delete(bank.keyFilePath);
        }

        await this.dao.updateIntegration(id, {
          certFormat: BankCertFormat.Pfx,
          certFilePath,
          keyFilePath: null,
          certPasswordCiphertext: this.secretsCrypto.encrypt(password),
          certificateNotAfter: material.notAfter,
        });
      }
      catch (error) {
        this.rethrowCertificateError(error);
      }
    }
    else if (certFile && keyFile) {
      this.assertSize(certFile);
      this.assertSize(keyFile);

      try {
        const material = this.certificateParser.parsePemPair(certFile.buffer, keyFile.buffer);
        const certFilePath = `${id}/cert.enc`;
        const keyFilePath = `${id}/key.enc`;
        await this.localSecureFile.write(certFilePath, this.secretsCrypto.encryptBytes(certFile.buffer));
        await this.localSecureFile.write(keyFilePath, this.secretsCrypto.encryptBytes(keyFile.buffer));

        await this.dao.updateIntegration(id, {
          certFormat: BankCertFormat.PemPair,
          certFilePath,
          keyFilePath,
          certPasswordCiphertext: null,
          certificateNotAfter: material.notAfter,
        });
      }
      catch (error) {
        this.rethrowCertificateError(error);
      }
    }

    return { message: 'Certificado do banco atualizado com sucesso' };
  }

  private assertSize(file: Express.Multer.File): void {
    const size = file.buffer?.length ?? file.size ?? 0;
    if (size > MAX_CERTIFICATE_BYTES) {
      throw new FileTooBigError(1);
    }
  }

  private rethrowCertificateError(error: unknown): never {
    if (error instanceof AppException) {
      throw new InvalidBankCertificateError(error.message);
    }

    throw new InvalidBankCertificateError();
  }
}
