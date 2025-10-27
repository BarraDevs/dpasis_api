import { AppException } from 'src/core/filters/app.exception';

export class AddressNotFoundError extends AppException {
  constructor() {
    super('Endereço não encontrado na base de dados', 404);
    this.name = 'AddressNotFoundError';
  }
}
