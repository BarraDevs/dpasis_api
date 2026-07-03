import { AppException } from 'src/core/filters/app.exception';

export class InvalidProviderItemScheduleTypeError extends AppException {
  constructor() {
    super('Tipo de vencimento inválido.', 400);
    this.name = 'InvalidProviderItemScheduleTypeError';
  }
}
