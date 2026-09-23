import { AppException } from 'src/core/filters/app.exception';

export class EmailTemplateNotFoundError extends AppException {
  constructor() {
    super('Template de e-mail não encontrado na base de dados.', 404);
    this.name = 'EmailTemplateNotFoundError';
  }
}
