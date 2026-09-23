import { AppException } from 'src/core/filters/app.exception';

export class EmailTemplateVariableUnknownError extends AppException {
  constructor(keys: string[]) {
    super(
      keys.length === 1
        ? `A variável ${keys[0]} não está cadastrada ou está inativa.`
        : `As variáveis ${keys.join(', ')} não estão cadastradas ou estão inativas.`,
    );
    this.name = 'EmailTemplateVariableUnknownError';
  }
}
