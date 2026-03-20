import { AppException } from 'src/core/filters/app.exception';

export class ServiceProposalValidityAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe uma validade de proposta com o nome: ${name}`, 409);
    this.name = 'ServiceProposalValidityAlreadyExistsError';
  }
}
