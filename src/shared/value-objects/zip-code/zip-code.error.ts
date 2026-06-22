import { AppException } from 'src/core/filters/app.exception';

export class InvalidZipCodeError extends AppException {
  constructor(zipCode: string) {
    super(`CEP inválido: ${zipCode}`, 400);
    this.name = 'InvalidZipCodeError';
  }
}
