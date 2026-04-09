import { AppException } from 'src/core/filters/app.exception';

export class ProposalValidityAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe uma validade com o nome: ${name}`, 409);
    this.name = 'ProposalValidityAlreadyExistsError';
  }
}
