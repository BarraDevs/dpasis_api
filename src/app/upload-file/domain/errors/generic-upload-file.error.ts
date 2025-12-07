import { AppException } from 'src/core/filters/app.exception';

export class FileIsRequiredError extends AppException {
  constructor() {
    super('O arquivo é obrigatório', 400);
  }
}
