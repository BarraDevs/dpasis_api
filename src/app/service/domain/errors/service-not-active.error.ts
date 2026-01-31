import { AppException } from 'src/core/filters/app.exception';

export class ServiceNotActiveError extends AppException {
  constructor(serviceName: string) {
    super(`Serviço "${serviceName}" está inativo`, 400);
    this.name = 'ServiceNotActiveError';
  }
}
