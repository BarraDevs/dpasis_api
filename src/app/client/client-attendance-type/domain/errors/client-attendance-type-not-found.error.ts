import { AppException } from 'src/core/filters/app.exception';

export class ClientAttendanceTypeNotFoundError extends AppException {
  constructor() {
    super('Tipo de atendimento de cliente não encontrado na base de dados.', 404);
    this.name = 'ClientAttendanceTypeNotFoundError';
  }
}
