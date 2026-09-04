import { ProviderAttemptDto } from './dtos/provider-attempt.dto';

export interface IProviderAttemptRecorder {
  /**
   * Grava uma tentativa contra provedor externo. Implementações **não podem lançar**: a trilha de
   * diagnóstico existe para explicar uma emissão, nunca para impedi-la.
   */
  record(attempt: ProviderAttemptDto): Promise<void>;
}
