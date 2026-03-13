import { AppException } from 'src/core/filters/app.exception';

export class ClientMaintenanceTicketTypeAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um tipo de chamado de manutenção de cliente com o nome: ${name}`, 409);
    this.name = 'ClientMaintenanceTicketTypeAlreadyExistsError';
  }
}
