import { AppException } from 'src/core/filters/app.exception';

export class NfmAlreadyExistsError extends AppException {
  constructor() {
    super('Nfm já existe.', 409);
    this.name = 'NfmAlreadyExistsError';
  }
}
