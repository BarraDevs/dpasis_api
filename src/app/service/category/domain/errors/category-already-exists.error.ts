import { AppException } from 'src/core/filters/app.exception';

export class CategoryAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe uma categoria com o nome: ${name}`, 409);
    this.name = 'CategoryAlreadyExistsError';
  }
}
