import { BankPaymentProvider } from '../enums/bank-payment-provider.enum';

/**
 * Input mínimo do boilerplate.
 * Campos de negócio (valor, vencimento, pagador, etc.) entram na integração Inter.
 */
export class IssueBankSlipInputDto {
  provider: BankPaymentProvider;
}

/**
 * Output mínimo do boilerplate.
 * Campos reais (linha digitável, PDF, nosso número, etc.) entram na integração Inter.
 */
export class IssueBankSlipOutputDto {
  provider: BankPaymentProvider;
  externalId: string;
}
