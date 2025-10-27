import { AppException } from 'src/core/filters/app.exception';

export class AddressMainMustBeOneError extends AppException {
  constructor() {
    super('Deve existir um e apenas um endereço principal', 403);
    this.name = 'AddressMainMustBeOneError';
  }
}
