import { AppException } from 'src/core/filters/app.exception';

export class EmailTemplateAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um template de e-mail com o nome: ${name}`, 409);
    this.name = 'EmailTemplateAlreadyExistsError';
  }
}
