import { AppException } from 'src/core/filters/app.exception';

export class ClientAddressInUseError extends AppException {
  constructor() {
    super('Não é possível excluir o endereço pois está vinculado a configurações de faturamento.', 409);
    this.name = 'ClientAddressInUseError';
  }
}
