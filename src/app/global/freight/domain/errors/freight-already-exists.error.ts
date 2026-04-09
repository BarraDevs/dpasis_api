import { AppException } from 'src/core/filters/app.exception';

export class FreightAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um frete com o nome: ${name}`, 409);
    this.name = 'FreightAlreadyExistsError';
  }
}
