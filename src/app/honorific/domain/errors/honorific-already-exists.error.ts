import { AppException } from 'src/core/filters/app.exception';

export class HonorificAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe este pronome de tratamento no sistema: ${name}`, 409);
    this.name = 'HonorificAlreadyExistsError';
  }
}
