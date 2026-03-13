import { AppException } from 'src/core/filters/app.exception';

export class ClientMaintenanceTicketTypeNotFoundError extends AppException {
  constructor() {
    super('Tipo de chamado de manutenção de cliente não encontrado na base de dados.', 404);
    this.name = 'ClientMaintenanceTicketTypeNotFoundError';
  }
}
