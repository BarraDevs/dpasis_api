import { AppException } from 'src/core/filters/app.exception';

export class EmailTemplateVariableAlreadyExistsError extends AppException {
  constructor(key: string) {
    super(`Já existe uma variável de template de e-mail com a chave: ${key}`, 409);
    this.name = 'EmailTemplateVariableAlreadyExistsError';
  }
}
