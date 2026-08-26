import { AppException } from 'src/core/filters/app.exception';
import { BankSlipProvider } from '../enums/bank-slip-provider.enum';

export class BankSlipProviderNotSupportedError extends AppException {
  constructor(provider: BankSlipProvider | string) {
    super(`Provedor de boleto não suportado: ${provider}.`, 400);
    this.name = 'BankSlipProviderNotSupportedError';
  }
}
