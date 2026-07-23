import { AppException } from 'src/core/filters/app.exception';

export class NfsProviderNotConfiguredError extends AppException {
  constructor() {
    super('Prestador não possui configuração de emissão de NFS-e cadastrada.', 400);
    this.name = 'NfsProviderNotConfiguredError';
  }
}
