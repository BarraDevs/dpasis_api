import { AppException } from 'src/core/filters/app.exception';

export class DuplicateNfseClassificationError extends AppException {
  constructor() {
    super('A carga contém RPS duplicado (mesmo número e série)');
    this.name = 'DuplicateNfseClassificationError';
  }
}
