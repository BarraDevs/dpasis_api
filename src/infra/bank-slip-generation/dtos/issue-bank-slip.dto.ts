import { BankSlipProvider } from '../enums/bank-slip-provider.enum';

/**
 * Input mínimo do boilerplate.
 * Campos de negócio (valor, vencimento, pagador, etc.) entram na integração Inter.
 */
export class IssueBankSlipInputDto {
  provider: BankSlipProvider;
}

/**
 * Output mínimo do boilerplate.
 * Campos reais (linha digitável, PDF, nosso número, etc.) entram na integração Inter.
 */
export class IssueBankSlipOutputDto {
  provider: BankSlipProvider;
  externalId: string;
}
