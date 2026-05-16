import { AppException } from 'src/core/filters/app.exception';

export class NfmNotFoundError extends AppException {
  constructor() {
    super('Nfm não encontrado.', 404);
    this.name = 'NfmNotFoundError';
  }
}
