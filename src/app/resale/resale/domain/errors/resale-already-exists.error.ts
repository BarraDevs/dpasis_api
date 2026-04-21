import { AppException } from 'src/core/filters/app.exception';

export class ResaleAlreadyExistsError extends AppException {
  constructor() {
    super('Revenda já cadastrada na base de dados.', 409);
    this.name = 'ResaleAlreadyExistsError';
  }
}
