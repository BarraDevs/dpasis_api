import { ProviderAttemptOperation } from '../enums/provider-attempt-operation.enum';

export class ProviderAttemptDto {
  nfseId: number;
  operation: ProviderAttemptOperation;
  requestBody?: string | null;
  responseBody?: string | null;
  httpStatus?: number | null;
  errorClass?: string | null;
  durationMs?: number | null;
}
