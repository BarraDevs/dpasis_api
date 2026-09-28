import { AppException } from 'src/core/filters/app.exception';

export class BankIntegrationNotConfiguredError extends AppException {
  constructor() {
    super('Banco sem credenciais de integração configuradas.', 400);
    this.name = 'BankIntegrationNotConfiguredError';
  }
}
