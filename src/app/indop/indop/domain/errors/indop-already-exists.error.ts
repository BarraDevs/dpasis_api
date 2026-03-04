import { AppException } from 'src/core/filters/app.exception';

export class IndopAlreadyExistsError extends AppException {
  constructor(code: string) {
    super(`Já existe um INDOP com o código: ${code}`, 409);
    this.name = 'IndopAlreadyExistsError';
  }
}
