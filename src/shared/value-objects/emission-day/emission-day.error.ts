import { AppException } from 'src/core/filters/app.exception';

export class InvalidEmissionDayError extends AppException {
  constructor() {
    super('Dia de emissão deve ser entre 1 e 31.', 400);
    this.name = 'InvalidEmissionDayError';
  }
}
