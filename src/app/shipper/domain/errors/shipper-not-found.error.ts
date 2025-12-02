import { AppException } from 'src/core/filters/app.exception';

export class ShipperNotFoundError extends AppException {
  constructor() {
    super('Transportadora não encontrada na base de dados', 404);
    this.name = 'ShipperNotFoundError';
  }
}
