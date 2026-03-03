import { AppException } from 'src/core/filters/app.exception';

export class CnaeAlreadyExistsError extends AppException {
  constructor(code: string) {
    super(`Já existe um CNAE com o código: ${code}`, 409);
    this.name = 'CnaeAlreadyExistsError';
  }
}
