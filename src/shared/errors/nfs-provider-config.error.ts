import { AppException } from 'src/core/filters/app.exception';

export class NfsProviderConfigError extends AppException {
  constructor(message: string) {
    super(message, 400);
    this.name = 'NfsProviderConfigError';
  }
}
