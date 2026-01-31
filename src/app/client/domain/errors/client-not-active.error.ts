import { AppException } from 'src/core/filters/app.exception';

export class ClientNotActiveError extends AppException {
  constructor(clientName: string) {
    super(`Cliente "${clientName}" está inativo`, 400);
    this.name = 'ClientNotActiveError';
  }
}
