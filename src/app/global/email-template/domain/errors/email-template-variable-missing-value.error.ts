import { AppException } from 'src/core/filters/app.exception';

export class EmailTemplateVariableMissingValueError extends AppException {
  constructor(keys: string[]) {
    super(
      keys.length === 1
        ? `A variável ${keys[0]} não recebeu valor.`
        : `As variáveis ${keys.join(', ')} não receberam valor.`,
    );
    this.name = 'EmailTemplateVariableMissingValueError';
  }
}
