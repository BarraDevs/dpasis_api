import { AppException } from 'src/core/filters/app.exception';

export class ClientMaintenanceTicketNotFoundError extends AppException {
  constructor() {
    super('Chamado de manutenção de cliente não encontrado na base de dados.', 404);
    this.name = 'ClientMaintenanceTicketNotFoundError';
  }
}
