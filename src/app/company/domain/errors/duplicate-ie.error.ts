import { AppException } from 'src/core/filters/app.exception';

export class CompanyDuplicateIeError extends AppException {
  constructor() {
    super('IE já cadastrado. Tente novamente com outro IE.', 409);
    this.name = 'CompanyDuplicateIeError';
  }
}
