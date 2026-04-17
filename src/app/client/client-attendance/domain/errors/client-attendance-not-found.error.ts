import { AppException } from 'src/core/filters/app.exception';

export class ClientAttendanceNotFoundError extends AppException {
  constructor() {
    super('Atendimento de cliente não encontrado na base de dados.', 404);
    this.name = 'ClientAttendanceNotFoundError';
  }
}
