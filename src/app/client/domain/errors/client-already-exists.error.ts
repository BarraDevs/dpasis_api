import { AppException } from 'src/core/filters/app.exception';

export class ClientAlreadyExistsError extends AppException {
  constructor() {
    super('Client já existe.', 409);
    this.name = 'ClientAlreadyExistsError';
  }
}
