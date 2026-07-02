import { AppException } from 'src/core/filters/app.exception';

export class HonorificInUseError extends AppException {
  constructor() {
    super(
      'Este pronome de tratamento está associado a um ou mais clientes ou revendas e não pode ser excluído.',
      409,
    );
    this.name = 'HonorificInUseError';
  }
}
