import { AppException } from 'src/core/filters/app.exception';

export class ClientDescriptionTypeAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um tipo de descrição de cliente com o nome: ${name}`, 409);
    this.name = 'ClientDescriptionTypeAlreadyExistsError';
  }
}
