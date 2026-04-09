import { AppException } from 'src/core/filters/app.exception';

export class ProposalValidityNotFoundError extends AppException {
  constructor() {
    super('Validade não encontrada na base de dados.', 404);
    this.name = 'ProposalValidityNotFoundError';
  }
}
