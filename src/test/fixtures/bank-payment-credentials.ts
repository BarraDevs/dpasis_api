import { BankPaymentCredentialsDto } from 'src/infra/bank-payment/dtos/bank-payment-credentials.dto';
import { buildTestTlsMaterial } from './test-certificate';

let cachedMaterial: { certPem: string; keyPem: string } | undefined;

export function makeBankPaymentCredentials(
  overrides: Partial<BankPaymentCredentialsDto> = {},
): BankPaymentCredentialsDto {
  cachedMaterial ??= buildTestTlsMaterial();

  return {
    bankId: 1,
    apiUrl: 'https://cdpj-sandbox.partners.uatinter.co',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    certPem: cachedMaterial.certPem,
    keyPem: cachedMaterial.keyPem,
    ...overrides,
  };
}
