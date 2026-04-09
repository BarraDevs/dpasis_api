import { AppException } from 'src/core/filters/app.exception';

export class WarrantyAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe uma garantia com o nome: ${name}`, 409);
    this.name = 'WarrantyAlreadyExistsError';
  }
}
