import { AppException } from 'src/core/filters/app.exception';

export class InterWebhookNotConfiguredError extends AppException {
  constructor() {
    super('Webhook do Banco Inter não configurado.', 404);
    this.name = 'InterWebhookNotConfiguredError';
  }
}
