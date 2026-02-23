import { AppException } from 'src/core/filters/app.exception';

export class ExternalApiError extends AppException {
  constructor(message: string) {
    super(message, 503);
    this.name = 'ExternalApiError';
  }
}
