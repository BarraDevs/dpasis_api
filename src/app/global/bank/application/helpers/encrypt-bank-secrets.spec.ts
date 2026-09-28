import { SecretsCryptoFakeAdapterGateway } from 'src/infra/secrets-crypto/adapters/fake/secrets-crypto-fake.gateway';
import { encryptBankSecrets } from './encrypt-bank-secrets';

describe('encryptBankSecrets - Unit tests', () => {
  const crypto = new SecretsCryptoFakeAdapterGateway();

  it('should be defined', () => {
    expect(encryptBankSecrets).toBeDefined();
  });

  it('should leave persistence empty when no secrets are sent', () => {
    const result = encryptBankSecrets(crypto, {}, { generateWebhookIfMissing: true });
    expect(result.persistence).toEqual({});
    expect(result.generatedWebhookToken).toBeUndefined();
  });

  it('should generate a webhook token only when both keys are present', () => {
    const result = encryptBankSecrets(crypto, {
      clientId: 'abc-xyz',
      clientSecret: 'secret',
    }, { generateWebhookIfMissing: true });

    expect(result.persistence.clientIdHint).toBe('-xyz');
    expect(result.generatedWebhookToken).toEqual(expect.any(String));
    expect(result.persistence.webhookTokenHash).toHaveLength(64);
  });

  it('should not generate a webhook token on edit', () => {
    const result = encryptBankSecrets(crypto, {
      clientId: 'abc-xyz',
      clientSecret: 'secret',
    }, { generateWebhookIfMissing: false });

    expect(result.generatedWebhookToken).toBeUndefined();
    expect(result.persistence.webhookTokenHash).toBeUndefined();
  });
});
