import { AppException } from 'src/core/filters/app.exception';

export class RequiredFileError extends AppException {
  constructor() {
    super('Arquivo obrigatório', 422);
    this.name = 'RequiredFileError';
  }
}
