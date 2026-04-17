import { AppException } from 'src/core/filters/app.exception';

export class ClientMaintenanceTicketAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um chamado de manutenção de cliente com o nome: ${name}`, 409);
    this.name = 'ClientMaintenanceTicketAlreadyExistsError';
  }
}
