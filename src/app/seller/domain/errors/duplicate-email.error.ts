import { AppException } from 'src/core/filters/app.exception';

export class SellerDuplicateEmailError extends AppException {
  constructor() {
    super('Já existe um vendedor com este email', 409);
    this.name = 'SellerDuplicateEmailError';
  }
}

