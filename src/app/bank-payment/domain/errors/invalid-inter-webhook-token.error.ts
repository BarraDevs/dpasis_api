import { AppException } from 'src/core/filters/app.exception';

export class InvalidInterWebhookTokenError extends AppException {
  constructor() {
    super('Token do webhook do Banco Inter inválido.', 401);
    this.name = 'InvalidInterWebhookTokenError';
  }
}
