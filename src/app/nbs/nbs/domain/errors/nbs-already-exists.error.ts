import { AppException } from 'src/core/filters/app.exception';

export class NbsAlreadyExistsError extends AppException {
  constructor(code: string) {
    super(`Já existe um NBS com o código: ${code}`, 409);
    this.name = 'NbsAlreadyExistsError';
  }
}
