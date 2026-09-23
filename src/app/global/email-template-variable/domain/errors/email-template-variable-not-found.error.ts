import { AppException } from 'src/core/filters/app.exception';

export class EmailTemplateVariableNotFoundError extends AppException {
  constructor() {
    super('Variável de template de e-mail não encontrada na base de dados.', 404);
    this.name = 'EmailTemplateVariableNotFoundError';
  }
}
