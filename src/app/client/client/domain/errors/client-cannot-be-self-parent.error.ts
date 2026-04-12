import { AppException } from 'src/core/filters/app.exception';

export class ClientCannotBeSelfParentError extends AppException {
  constructor() {
    super('Um cliente não pode ser dependente de si mesmo.', 422);
    this.name = 'ClientCannotBeSelfParentError';
  }
}
