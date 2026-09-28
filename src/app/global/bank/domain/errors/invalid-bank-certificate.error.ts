import { AppException } from 'src/core/filters/app.exception';

export class InvalidBankCertificateError extends AppException {
  constructor(message = 'Certificado bancário inválido.') {
    super(message, 400);
    this.name = 'InvalidBankCertificateError';
  }
}
