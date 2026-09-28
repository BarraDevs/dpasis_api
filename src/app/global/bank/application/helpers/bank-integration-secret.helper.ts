import { createHash, randomBytes } from 'node:crypto';

export function hashWebhookToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateWebhookToken(): string {
  return randomBytes(32).toString('base64url');
}

export function clientIdHintFrom(clientId: string): string {
  const trimmed = clientId.trim();
  return trimmed.slice(-4);
}
