import { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import { BankIntegrationPersistence } from '../persistence/dao/bank-dao.interface';
import { clientIdHintFrom, generateWebhookToken, hashWebhookToken } from './bank-integration-secret.helper';

export type BankSecretInput = {
  apiUrl?: string | null;
  clientId?: string;
  clientSecret?: string;
  webhookToken?: string;
};

export type EncryptedBankSecrets = {
  persistence: BankIntegrationPersistence;
  generatedWebhookToken?: string;
};

export function encryptBankSecrets(
  crypto: ISecretsCryptoGateway,
  input: BankSecretInput,
  options: { generateWebhookIfMissing: boolean },
): EncryptedBankSecrets {
  const persistence: BankIntegrationPersistence = {};
  let generatedWebhookToken: string | undefined;

  if (input.apiUrl !== undefined) {
    persistence.apiUrl = input.apiUrl?.trim() || null;
  }

  const clientId = input.clientId?.trim();
  if (clientId) {
    persistence.clientIdCiphertext = crypto.encrypt(clientId);
    persistence.clientIdHint = clientIdHintFrom(clientId);
  }

  const clientSecret = input.clientSecret?.trim();
  if (clientSecret) {
    persistence.clientSecretCiphertext = crypto.encrypt(clientSecret);
  }

  const webhookToken = input.webhookToken?.trim();
  if (webhookToken) {
    persistence.webhookTokenHash = hashWebhookToken(webhookToken);
  }
  else if (options.generateWebhookIfMissing && clientId && clientSecret) {
    generatedWebhookToken = generateWebhookToken();
    persistence.webhookTokenHash = hashWebhookToken(generatedWebhookToken);
  }

  return { persistence, generatedWebhookToken };
}
