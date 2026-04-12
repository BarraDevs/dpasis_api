import { AppException } from 'src/core/filters/app.exception';

export class ClientParentIsSubClientError extends AppException {
  constructor() {
    super('O cliente titular informado é um sub-cliente e não pode ter dependentes.', 422);
    this.name = 'ClientParentIsSubClientError';
  }
}
