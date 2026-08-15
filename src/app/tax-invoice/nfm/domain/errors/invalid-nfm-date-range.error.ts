import { AppException } from 'src/core/filters/app.exception';

export class InvalidNfmDateRangeError extends AppException {
  constructor() {
    super('dateStart não pode ser posterior a dateEnd');
    this.name = 'InvalidNfmDateRangeError';
  }
}
