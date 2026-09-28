import { AppException } from 'src/core/filters/app.exception';

export class BankCertificateRequiredError extends AppException {
  constructor() {
    super('Envie o arquivo PFX com senha ou o par CRT e KEY.', 400);
    this.name = 'BankCertificateRequiredError';
  }
}
