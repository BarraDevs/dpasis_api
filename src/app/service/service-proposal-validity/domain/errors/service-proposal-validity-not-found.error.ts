import { AppException } from 'src/core/filters/app.exception';

export class ServiceProposalValidityNotFoundError extends AppException {
  constructor() {
    super('Validade de proposta não encontrada na base de dados.', 404);
    this.name = 'ServiceProposalValidityNotFoundError';
  }
}
