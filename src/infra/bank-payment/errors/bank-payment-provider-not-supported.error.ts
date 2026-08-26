import { AppException } from 'src/core/filters/app.exception';
import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';

export class BankPaymentProviderNotSupportedError extends AppException {
  constructor(provider: BankPaymentProvider | string) {
    super(`Provedor bancário não suportado: ${provider}.`, 400);
    this.name = 'BankPaymentProviderNotSupportedError';
  }
}
