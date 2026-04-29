import { AppException } from 'src/core/filters/app.exception';

export class ClientHasSubClientsCannotSetParentError extends AppException {
  constructor() {
    super(
      'Este cliente possui sub-clientes vinculados e não pode ser associado a um cliente titular. Remova ou transfira os sub-clientes primeiro.',
      422,
    );
    this.name = 'ClientHasSubClientsCannotSetParentError';
  }
}
